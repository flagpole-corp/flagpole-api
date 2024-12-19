import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User, UserDocument } from "./schemas/user.schema";
import { Resend } from "resend";
import * as crypto from "crypto";
import { OrganizationRole, UserStatus } from "../common/enums";

interface ProjectDocument {
  _id: string;
  name: string;
}

interface PopulatedProject {
  project: ProjectDocument;
  addedAt: Date;
}

@Injectable()
export class UsersService {
  private resend: Resend;

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async findByOrganization(organizationId: string) {
    const users = await this.userModel
      .find({
        "organizations.organization": new Types.ObjectId(organizationId),
      })
      .select("-password")
      .populate<{ projects: PopulatedProject[] }>({
        path: "projects.project",
        select: "_id name",
      })
      .lean()
      .exec();

    return users.map((user) => {
      const orgMembership = user.organizations.find(
        (org) => org.organization.toString() === organizationId
      );

      return {
        ...user,
        organizationRole: orgMembership?.role || "member",
        projects:
          user.projects?.map((p) => ({
            _id: p.project._id.toString(),
            name: p.project.name,
            addedAt: p.addedAt,
          })) || [],
      };
    });
  }

  async inviteUser(
    email: string,
    organizationId: string,
    role: OrganizationRole = OrganizationRole.MEMBER,
    projects: string[] = []
  ) {
    // Check if user already exists
    let user = await this.userModel.findOne({ email });

    if (user?.status === UserStatus.ACTIVE) {
      throw new BadRequestException("User already exists and is active");
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 24); // 24 hour expiry

    if (!user) {
      // Create new user if doesn't exist
      user = new this.userModel({
        email,
        status: UserStatus.PENDING,
        invitationToken: token,
        invitationTokenExpires: tokenExpires,
        organizations: [
          {
            organization: new Types.ObjectId(organizationId),
            role,
            joinedAt: new Date(),
          },
        ],
        currentOrganization: new Types.ObjectId(organizationId),
        projects: projects.map((projectId) => ({
          project: new Types.ObjectId(projectId),
          addedAt: new Date(),
        })),
      });
    } else {
      // Update existing user
      user.status = UserStatus.PENDING;
      user.invitationToken = token;
      user.invitationTokenExpires = tokenExpires;

      // Add organization if not already present
      const hasOrg = user.organizations.some(
        (org) => org.organization.toString() === organizationId
      );

      if (!hasOrg) {
        user.organizations.push({
          organization: new Types.ObjectId(organizationId),
          role,
          joinedAt: new Date(),
        });
      }

      // Update projects
      user.projects = projects.map((projectId) => ({
        project: new Types.ObjectId(projectId),
        addedAt: new Date(),
      }));
    }

    await user.save();

    // Send invitation email
    const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;

    const emailResponse = await this.resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Invitation to join organization",
      html: `
        <h1>You've been invited!</h1>
        <p>Click the link below to accept your invitation:</p>
        <a href="${inviteUrl}">${inviteUrl}</a>
        <p>This link will expire in 24 hours.</p>
      `,
    });

    console.log("Email sent (test mode):", emailResponse);

    return user;
  }

  async acceptInvitation(token: string, password: string) {
    const user = await this.userModel.findOne({
      invitationToken: token,
      invitationTokenExpires: { $gt: new Date() },
      status: UserStatus.PENDING,
    });

    if (!user) {
      throw new NotFoundException("Invalid or expired invitation token");
    }

    user.status = UserStatus.ACTIVE;
    user.password = password; // Note: Hash password before saving
    user.invitationToken = undefined;
    user.invitationTokenExpires = undefined;

    return user.save();
  }

  async updateUserRole(
    userId: string,
    organizationId: string,
    role: OrganizationRole
  ) {
    const user = await this.userModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(userId),
        "organizations.organization": new Types.ObjectId(organizationId),
      },
      {
        $set: {
          "organizations.$.role": role,
        },
      },
      { new: true }
    );

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async updateUserProjects(userId: string, projectIds: string[]) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    user.projects = projectIds.map((projectId) => ({
      project: new Types.ObjectId(projectId),
      addedAt: new Date(),
    }));

    return user.save();
  }

  async deleteUser(userId: string, organizationId: string) {
    const user = await this.userModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(userId),
        "organizations.organization": new Types.ObjectId(organizationId),
      },
      {
        $set: {
          status: "inactive",
          currentOrganization: null,
          "organizations.$.removedAt": new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async resendInvitation(userId: string, organizationId: string) {
    const user = await this.userModel.findOne({
      _id: new Types.ObjectId(userId),
      status: "pending",
      "organizations.organization": new Types.ObjectId(organizationId),
    });

    if (!user) {
      throw new NotFoundException("Pending user not found");
    }

    // Generate new token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 24);

    user.invitationToken = token;
    user.invitationTokenExpires = tokenExpires;
    await user.save();

    // Send new invitation email
    const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;
    await this.resend.emails.send({
      from: "onboarding@resend.dev",
      to: user.email,
      subject: "Invitation to join organization (Resent)",
      html: `
        <h1>Your invitation has been resent</h1>
        <p>Click the link below to accept your invitation:</p>
        <a href="${inviteUrl}">${inviteUrl}</a>
        <p>This link will expire in 24 hours.</p>
      `,
    });

    return user;
  }
}

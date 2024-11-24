import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Organization } from "./schemas/organization.schema";
import { User, UserDocument } from "../users/schemas/user.schema";
import { CreateOrganizationDto, AddUserToOrganizationDto } from "./dto";
import { OrganizationRole, SubscriptionStatus } from "../common/enums";

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name)
    private organizationModel: Model<Organization>,
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {}

  async create(createOrgDto: CreateOrganizationDto, userId: string) {
    const session = await this.organizationModel.db.startSession();
    session.startTransaction();

    try {
      const organization = new this.organizationModel({
        ...createOrgDto,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
      });

      const savedOrg = await organization.save({ session });

      // Add user as organization owner
      await this.userModel.findByIdAndUpdate(
        userId,
        {
          $push: {
            organizations: {
              organization: savedOrg._id,
              role: OrganizationRole.OWNER,
              joinedAt: new Date(),
            },
          },
          currentOrganization: savedOrg._id,
        },
        { session }
      );

      await session.commitTransaction();
      return savedOrg;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async addUserToOrganization(
    organizationId: string,
    email: string,
    role: OrganizationRole = OrganizationRole.MEMBER
  ) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const userInOrg = await this.userModel.findOne({
      "organizations.organization": organizationId,
      _id: user._id,
    });

    if (userInOrg) {
      throw new ConflictException("User already in organization");
    }

    return this.userModel.findByIdAndUpdate(
      user._id,
      {
        $push: {
          organizations: {
            organization: new Types.ObjectId(organizationId),
            role,
            joinedAt: new Date(),
          },
        },
      },
      { new: true }
    );
  }

  async switchUserOrganization(userId: string, organizationId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const orgMembership = user.organizations.find(
      (org) => org.organization.toString() === organizationId
    );

    if (!orgMembership) {
      throw new NotFoundException("User is not a member of this organization");
    }

    // Update using findByIdAndUpdate instead of modifying the document directly
    return this.userModel.findByIdAndUpdate(
      userId,
      { currentOrganization: new Types.ObjectId(organizationId) },
      { new: true }
    );
  }

  // Helper method to validate and convert string to ObjectId
  private toObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException("Invalid ID format");
    }
    return new Types.ObjectId(id);
  }
}

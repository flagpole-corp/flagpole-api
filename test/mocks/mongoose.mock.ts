export const createMockMongooseModel = () => {
  const mockModel = function () {
    this.save = jest.fn().mockResolvedValue(this);
    return this;
  };

  mockModel.findOne = jest.fn();
  mockModel.findById = jest.fn();
  mockModel.updateOne = jest.fn();
  mockModel.prototype.save = jest.fn();

  return mockModel;
};

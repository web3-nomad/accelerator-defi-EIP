import { ethers, expect } from "./setup";
import { MeaningOfLife } from "../typechain-types";

// constants
// Tests
describe("MeaningOfLife", function () {
  async function deployFixture() {
    const [
      owner,
    ] = await ethers.getSigners();
    let MeaningOfLifeContract: MeaningOfLife;

    const MeaningOfLifeFac = await ethers.getContractFactory("MeaningOfLife");
    MeaningOfLifeContract = await MeaningOfLifeFac.deploy();
    await MeaningOfLifeContract.waitForDeployment();

    return {
      MeaningOfLifeContract,
      owner,
    };
  }

  describe("test", function () {
    it("Should pass", async function () {
      const { MeaningOfLifeContract } = await deployFixture();
      expect(
        await MeaningOfLifeContract.theMeaningOfLifeIs()
      ).to.eq(42);
    });
  });
});

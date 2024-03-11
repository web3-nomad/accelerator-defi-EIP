import { MeaningOfLife } from "../typechain-types";
import { ethers, expect } from "./setup";
  
describe("MeaningOfLife", function () {
  let MeaningOfLifeContract: MeaningOfLife;

  beforeEach(async () => {
    const factory = await ethers.getContractFactory("MeaningOfLife");
    MeaningOfLifeContract = await factory.deploy();
  });

  it("Should be 42", async function () {
    expect(await MeaningOfLifeContract.theMeaningOfLifeIs()).to.equal(42);
  });
});

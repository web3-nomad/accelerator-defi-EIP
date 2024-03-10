import { ethers, upgrades } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("Deploying contract with account:", deployer.address, "at:", network.name);

  const args: any[] = [];

  const Contract = await ethers.getContractFactory("MeaningOfLife");
  const instance = await upgrades.deployProxy(Contract, args);
  await instance.waitForDeployment();

  const address = await instance.getAddress();

  console.log("contract deployed to:", address, "at:", network.name);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
  
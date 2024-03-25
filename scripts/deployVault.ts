import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { deployContract, createFungibleToken } from "../scripts/utils";
import { Client, AccountId, PrivateKey, ContractFunctionParameters, TokenId } from "@hashgraph/sdk";
import hre from "hardhat";
import { log } from "console";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("Deploying contract with account:", deployer.address, "at:", network.name);

  // const Token = await ethers.getContractFactory("VaultToken");
  // const token = await Token.deploy();
  // await token.waitForDeployment();

  // const tokenAddress = await token.getAddress();
  // console.log(tokenAddress);

  // console.log("Hash token ", token.deploymentTransaction());

  let client = Client.forTestnet();

  const operatorPrKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY || '');
  const operatorAccountId = AccountId.fromString(process.env.OPERATOR_ID || '');

  client.setOperator(
    operatorAccountId,
    operatorPrKey
  );

  const createERC4626 = await createFungibleToken(
    "ERC4626 on Hedera",
    "HERC4626",
    process.env.OPERATOR_ID,
    operatorPrKey.publicKey,
    client,
    operatorPrKey
  );

  const a = await hre.artifacts.readArtifact("HederaVault");
  const constructorParameters = new ContractFunctionParameters()
    .addAddress(createERC4626!.toSolidityAddress());

  const tokenAddress = "0x" + createERC4626!.toSolidityAddress();

  const HederaVault = await ethers.getContractFactory("HederaVault");
  const hederaVault = await HederaVault.deploy(
    tokenAddress,
    "TST",
    "TST",
    { from: deployer.address, value: ethers.parseUnits("10", 18) }
  );
  console.log("Hash ", hederaVault.deploymentTransaction()?.hash);
  await hederaVault.waitForDeployment();

  console.log(await hederaVault.getAddress());

  // const createERC4626Contract = await deployContract(
  //   client,
  //   a.bytecode,
  //   1500000,
  //   operatorPrKey,
  //   constructorParameters
  // );
  // console.log(`- Contract created ${createERC4626Contract!.toString()} ,Contract Address ${createERC4626Contract!.toSolidityAddress()} -`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers } from "hardhat";
import OnchainID from '@onchain-id/solidity';

async function deploySuite() {
  const {
    PRIVATE_KEY,
    TREX_FACTORY_ADDRESS,
    CLAIM_ISSUER_CONTRACT_ADDRESS
  } = process.env;

  if (!PRIVATE_KEY || !TREX_FACTORY_ADDRESS || !CLAIM_ISSUER_CONTRACT_ADDRESS) {
    throw new Error('Invalid configuration to deploy suite');
  }

  const deployer = new ethers.Wallet(PRIVATE_KEY, ethers.provider);
  
  const trexFactory = await ethers.getContractAt(
    'TREXFactory', 
    TREX_FACTORY_ADDRESS
  );
  
  const claimIssuerContractAddress = await ethers.getContractAt(
    OnchainID.contracts.ClaimIssuer.abi, 
    CLAIM_ISSUER_CONTRACT_ADDRESS
  );

  // TODO: add compliance module to handle specific rules of RWA R US
  // TODO: create script to deploy compliance modules
  const countryAllowModule = await ethers.deployContract('CountryAllowModule');

  const tx = await trexFactory.connect(deployer).deployTREXSuite(
    'salt',
    {
      owner: deployer.address,
      name: 'Token name',
      symbol: 'SYM',
      decimals: 8,
      irs: ethers.ZeroAddress,
      ONCHAINID: ethers.ZeroAddress,
      irAgents: [deployer],
      tokenAgents: [deployer],
      complianceModules: [await countryAllowModule.getAddress()],
      complianceSettings: [
        new ethers.Interface(['function batchAllowCountries(uint16[] calldata countries)']).encodeFunctionData('batchAllowCountries', [
          [42, 66],
        ]),
      ],
    },
    {
      claimTopics: [ethers.keccak256(ethers.toUtf8Bytes('DEMO_TOPIC'))],
      issuers: [claimIssuerContractAddress],
      issuerClaims: [[ethers.keccak256(ethers.toUtf8Bytes('DEMO_TOPIC'))]],
    },
  );

  await tx.wait();

  const tokenAddress = await trexFactory.getToken('salt');

  console.log(`Token deployed at address ${tokenAddress}`);
}

deploySuite()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

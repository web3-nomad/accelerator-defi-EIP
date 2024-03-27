import { anyValue, ethers, upgrades } from "./setup";
import { createFungibleToken, getClient } from "../scripts/utils";
import { PrivateKey, Client, AccountId } from "@hashgraph/sdk";
import { expect } from "chai";

// constants
let client;
// Tests
describe("Vault", function () {
    async function deployFixture() {
        const [
            owner,
            to,
            admin,
            ...otherAccounts
        ] = await ethers.getSigners();

        // client = getClient();

        const client = Client.forTestnet();

        const operatorPrKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY || '');
        const operatorAccountId = AccountId.fromString(process.env.OPERATOR_ID || '');

        client.setOperator(
            operatorAccountId,
            operatorPrKey
        );

        console.log(owner);

        const createERC4626 = await createFungibleToken(
            "ERC4626 on Hedera",
            "HERC4626",
            process.env.OPERATOR_ID,
            operatorPrKey.publicKey,
            client,
            operatorPrKey
        );

        console.log("fungible token created");

        const stakingTokenAddress = "0x" + createERC4626!.toSolidityAddress();

        const HederaVault = await ethers.getContractFactory("HederaVault");
        const hederaVault = await HederaVault.deploy(
            stakingTokenAddress,
            "TST",
            "TST",
            { from: owner.address, value: ethers.parseUnits("25", 18) }
        );
        await hederaVault.waitForDeployment();

        console.log("Vault deployed");

        return {
            hederaVault,
            to,
            client,
            owner,
            admin,
            otherAccounts,
        };
    }

    describe("deployment", function () {
        it("Should set the right role", async function () {
            const { hederaVault } = await deployFixture();

        });
    });

    describe("deposit", function () {
        // it("Should deposit tokens and return shares", async function () {
        //     const { hederaVault, to, owner } = await deployFixture();
        //     const amountToDeposit = 1;

        //     const tx = await hederaVault.connect(owner).deposit(amountToDeposit, to.address);

        //     await expect(
        //         tx
        //     ).to.emit(hederaVault, "Deposit")
        //         .withArgs(owner.address, to.address, amountToDeposit, anyValue);
        // });

        it("preview", async function () {
            const { hederaVault, to, owner } = await deployFixture();
            const amountToDeposit = 1;

            console.log(await hederaVault.connect(owner).previewMint(amountToDeposit));
        });
    });
});

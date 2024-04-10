import { anyValue, ethers, expect } from "../setup";
import { TokenTransfer, createFungibleToken, TokenBalance, createAccount, addToken, mintToken } from "../../scripts/utils";
import { PrivateKey, Client, AccountId, TokenAssociateTransaction, AccountBalanceQuery } from "@hashgraph/sdk";
import hre from "hardhat";

// constants
const stakingTokenId = "0.0.3757626";
const sharesTokenAddress = "0x0000000000000000000000000000000000395640";
const vaultAddress = "0xb3C24B140BA2a69099276e55dE1885e93517C6C6";
const vaultId = "0.0.3757631";

const newStakingTokenId = "0.0.4178090";
const newVaultAddress = "0x26767C096B669b0A5Df59efeF0d6CbA3840E47F6"
const newRewardTokenId = "0.0.4178093";
const rewardTokenAddress = "";
const newSharesTokenAddress = "0x00000000000000000000000000000000003fc0b0";
const newVaultId = "0.0.4178095";
// Tests
describe("Vault", function () {
    async function deployFixture() {
        const [
            owner,
        ] = await ethers.getSigners();

        let client = Client.forTestnet();

        const operatorPrKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY || '');
        const operatorAccountId = AccountId.fromString(process.env.ACCOUNT_ID || '');

        client.setOperator(
            operatorAccountId,
            operatorPrKey
        );

        const erc20 = await hre.artifacts.readArtifact("contracts/erc4626/ERC20.sol:ERC20");

        // const rewardToken = await createFungibleToken(
        //     "Reward Token 1",
        //     "RT1",
        //     process.env.ACCOUNT_ID,
        //     operatorPrKey.publicKey,
        //     client,
        //     operatorPrKey
        // );

        // const tokenAssociate = await new TokenAssociateTransaction()
        //     .setAccountId(newVaultId)
        //     .setTokenIds([newRewardTokenId])
        //     .execute(client);

        const hederaVaultRevertCases = await ethers.getContractAt(
            "HederaVault",
            vaultAddress
        );
        const hederaVault = await ethers.getContractAt(
            "HederaVault",
            newVaultAddress
        );

        const stakingToken = await ethers.getContractAt(
            erc20.abi,
            await hederaVault.asset()
        );

        const sharesToken = await ethers.getContractAt(
            erc20.abi,
            sharesTokenAddress
        );

        // await TokenTransfer(stakingTokenId, operatorAccountId, vaultId, 10, client);

        const stakingTokenOperatorBalance = await (
            await TokenBalance(operatorAccountId, client)
        ).tokens!.get(stakingTokenId);
        console.log("Staking token balance: ", stakingTokenOperatorBalance.toString());

        return {
            hederaVault,
            hederaVaultRevertCases,
            stakingToken,
            sharesToken,
            client,
            owner,
        };
    }

    describe("deposit", function () {
        it("Should deposit tokens and return shares", async function () {
            const { hederaVault, owner, stakingToken } = await deployFixture();
            const amountToDeposit = 1;

            console.log(await hederaVault.previewDeposit(amountToDeposit));

            await stakingToken.approve(hederaVault.target, amountToDeposit);

            const tx = await hederaVault.connect(owner).deposit(
                amountToDeposit,
                owner.address,
                { gasLimit: 3000000 }
            );

            await expect(
                tx
            ).to.emit(hederaVault, "Deposit")
                .withArgs(owner.address, owner.address, amountToDeposit, anyValue);
        });

        it("Should revert if zero shares", async function () {
            const { hederaVaultRevertCases, owner } = await deployFixture();
            const amountToDeposit = 0;

            console.log(await hederaVaultRevertCases.previewDeposit(amountToDeposit));

            await expect(
                hederaVaultRevertCases.connect(owner).deposit(
                    amountToDeposit,
                    owner.address,
                    { gasLimit: 3000000 }
                )
            ).to.be.revertedWith("ZERO_SHARES");
        });
    });

    describe("withdraw", function () {
        it("Should withdraw tokens", async function () {
            const { hederaVault, owner } = await deployFixture();
            const amountToWithdraw = 1;

            const tx = await hederaVault.connect(owner).withdraw(
                amountToWithdraw,
                owner.address,
                owner.address,
                { gasLimit: 3000000 }
            );

            await expect(
                tx
            ).to.emit(hederaVault, "Withdraw")
                .withArgs(owner.address, owner.address, amountToWithdraw, anyValue);
        });
    });

    describe("mint", function () {
        it("Should mint tokens", async function () {
            const { hederaVault, owner, stakingToken } = await deployFixture();
            const amountOfShares = 1;

            const amount = await hederaVault.previewMint(amountOfShares);

            await stakingToken.approve(hederaVault.target, amount);

            const tx = await hederaVault.connect(owner).mint(
                amountOfShares,
                owner.address,
                { gasLimit: 3000000 }
            );

            await expect(
                tx
            ).to.emit(hederaVault, "Deposit")
                .withArgs(owner.address, owner.address, anyValue, amountOfShares);
        });
    });

    describe("redeem", function () {
        it("Should redeem tokens", async function () {
            const { hederaVault, owner, stakingToken, sharesToken, client } = await deployFixture();
            const amountOfShares = 1;

            const tokensAmount = await hederaVault.previewRedeem(amountOfShares);
            console.log("Preview redeem ", tokensAmount);

            console.log(await sharesToken.balanceOf(owner.address));
            console.log("TOTAL SUPPLY", await hederaVault.totalSupply());
            console.log("TOTAL ASSETS", await hederaVault.totalAssets());
            console.log("TOTAL TOKENS", await hederaVault.totalTokens());

            await stakingToken.approve(hederaVault.target, amountOfShares);

            const tx = await hederaVault.connect(owner).redeem(
                amountOfShares,
                owner.address,
                owner.address,
                { gasLimit: 3000000 }
            );

            await expect(
                tx
            ).to.emit(hederaVault, "Withdraw")
                .withArgs(owner.address, owner.address, tokensAmount, amountOfShares);
        });

        // it("Should revert if zero assets", async function () {
        //     const { hederaVault, owner } = await deployFixture();
        //     const amountToReedem = 0;

        //     await expect(
        //         hederaVault.connect(owner).redeem(
        //             amountToReedem,
        //             owner.address,
        //             owner.address,
        //             { gasLimit: 3000000 }
        //         )
        //     ).to.be.revertedWith("ZERO_ASSETS");
        // });
    });
});

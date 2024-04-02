import { anyValue, ethers, expect } from "./setup";
import { TokenTransfer, createFungibleToken, TokenBalance, createAccount, addToken, mintToken } from "../scripts/utils";
import { PrivateKey, Client, AccountId, TokenAssociateTransaction, AccountBalanceQuery } from "@hashgraph/sdk";

// constants
let client;
let aliceKey;
let aliceAccountId;
// Tests
describe("Vault", function () {
    async function deployFixture() {
        const [
            owner,
            to,
            admin,
            ...otherAccounts
        ] = await ethers.getSigners();

        let client = Client.forTestnet();

        const operatorPrKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY || '');
        const operatorAccountId = AccountId.fromString(process.env.ACCOUNT_ID || '');

        client.setOperator(
            operatorAccountId,
            operatorPrKey
        );

        // aliceKey = PrivateKey.generateED25519();
        // aliceAccountId = await createAccount(client, aliceKey, 20);
        // const alice = createAccount(client, aliceKey, aliceAccountId);

        // console.log("account creation success");

        const stakingToken = await createFungibleToken(
            "ERC4626 on Hedera",
            "HERC4626",
            process.env.ACCOUNT_ID,
            operatorPrKey.publicKey,
            client,
            operatorPrKey
        );

        const stakingTokenAddress = "0x" + stakingToken!.toSolidityAddress();

        const HederaVault = await ethers.getContractFactory("HederaVault");
        const hederaVault = await HederaVault.deploy(
            stakingTokenAddress,
            "TST",
            "TST",
            { from: owner.address, gasLimit: 3000000, value: ethers.parseUnits("10", 18) }
        );
        await hederaVault.waitForDeployment();

        // client.setOperator(aliceAccountId!, aliceKey);
        // const tokenAssociate = await new TokenAssociateTransaction()
        //     .setAccountId(aliceAccountId!)
        //     .setTokenIds([stakingToken!])
        //     .execute(client);

        // console.log("association success");

        // await mintToken(stakingToken, client, 100, operatorPrKey);

        // console.log("token mint success");

        // let balanceCheckTreasury = await new AccountBalanceQuery()
        //     .setAccountId(operatorAccountId)
        //     .execute(client);

        // console.log(
        //     " Treasury balance: " + balanceCheckTreasury.tokens
        // );

        // const stToken = ethers.getContractAt("HederaVault", stakingTokenAddress);

        // console.log("balance check", await stToken.(owner.address));

        // client.setOperator(
        //     operatorAccountId,
        //     operatorPrKey
        // );
        // await TokenTransfer(stakingToken, operatorAccountId, aliceAccountId, 50, client);

        // console.log("token transfer success");

        // console.log(
        //     await TokenBalance(receiver.address, client)
        // );

        return {
            hederaVault,
            stakingToken,
            // stToken,
            // alice,
            to,
            client,
            owner,
            admin,
            otherAccounts,
        };
    }

    describe("deposit", function () {
        // it("Should deposit tokens and return shares", async function () {
        //     const { hederaVault, to, owner, client, stakingToken } = await deployFixture();
        //     // const amountToDeposit = 1;
        //     // const amountToWithdraw = 1 * 1e8;

        //     // console.log("work1");
        //     // await addToken(hederaVault, stakingToken, 10, client);

        //     // console.log("work");

        //     // const tx = await hederaVault.connect(owner).withdraw(
        //     //     amountToWithdraw,
        //     //     owner.address,
        //     //     owner.address
        //     // );

        //     // console.log("with");

        //     // // const tx = await hederaVault.connect(owner).deposit(amountToDeposit, to.address);

        //     // await expect(
        //     //     tx
        //     // ).to.emit(hederaVault, "Withdraw")
        //     //     .withArgs(owner.address, owner.address, amountToWithdraw, anyValue);
        // });

        it("preview", async function () {
            const { hederaVault, to, owner } = await deployFixture();
            // const amountToDeposit = 1;

            // console.log(await hederaVault.connect(owner).previewMint(amountToDeposit));
        });
    });
});

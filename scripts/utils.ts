import {
    Client, AccountId, PrivateKey, TokenCreateTransaction, ContractCreateFlow,
    TokenType, TokenSupplyType,
} from "@hashgraph/sdk";

function getClient() {
    // const client = Client.forName(process.env.HEDERA_NETWORK);
    const client = Client.forTestnet();
    client.setOperator(
        AccountId.fromString(process.env.OPERATOR_ID || ''),
        PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY || '')
    );
    return client;
}

export async function deployContract(
    client: any,
    bytecode: any,
    gas: any,
    contractAdminKey: any,
    constructorParameters: any
) {
    const createContract = new ContractCreateFlow()
        .setGas(gas) // Increase if revert
        .setBytecode(bytecode); // Contract bytecode
    if (constructorParameters) {
        createContract.setConstructorParameters(constructorParameters);
    }
    if (contractAdminKey) {
        createContract.setAdminKey(contractAdminKey);
        await createContract.sign(contractAdminKey);
    }
    const createContractTx = await createContract.execute(client);
    const createContractRx = await createContractTx.getReceipt(client);
    const contractId = createContractRx.contractId;

    return contractId;

}

export async function createFungibleToken(
    tokenName: string,
    tokenSymbol: string,
    treasuryAccountId: any,
    supplyPublicKey: any,
    client: Client,
    privateKey: any) {
    // Create the transaction and freeze for manual signing
    const tokenCreateTx = await new TokenCreateTransaction()
        .setTokenName(tokenName)
        .setTokenSymbol(tokenSymbol)
        .setDecimals(8)
        .setInitialSupply(1000 * 1e8)
        .setTreasuryAccountId(treasuryAccountId)
        .setTokenType(TokenType.FungibleCommon)
        .setSupplyType(TokenSupplyType.Infinite)
        .setSupplyKey(supplyPublicKey)
        .freezeWith(client);


    const tokenCreateSign = await tokenCreateTx.sign(privateKey);
    const tokenCreateExec = await tokenCreateTx.execute(client);

    // Sign the transaction with the token adminKey and the token treasury account private key
    const tokenCreateRx = await tokenCreateExec.getReceipt(client);
    const tokenCreateRecord = await tokenCreateExec.getRecord(client);
    const transactionFee = await tokenCreateRecord.transactionFee._valueInTinybar;
    console.log("transactionFee", transactionFee);
    console.log(`- The token ID is: ${tokenCreateRx.tokenId!.toString()}`);
    const tokenId = tokenCreateRx.tokenId

    return tokenId;
}

module.exports = {
    createFungibleToken,
    getClient,
}

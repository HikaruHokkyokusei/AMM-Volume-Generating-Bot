import {createRequire} from "module";
import Web3 from "web3";

const require = createRequire(import.meta.url);
const configData = require("./configData.json");

const web3 = new Web3("https://bsc-dataseed.binance.org/");
const smartContract = new web3.eth.Contract(configData["contractAbi"], configData["contractAddress"]);

const baseTransaction = {
    "chainId": 0,
    "from": configData["senderAddress"],
    "to": configData["contractAddress"],
    "value": 0,
    "gas": configData["gasLimit"],
    "gasPrice": configData["gasPrice"]
};
const senderPK = process.env["senderPK"];

const sendTransactionToBlockchain = async (senderPK, functionName, params) => {
    let transactionData = {...baseTransaction};
    let execFunction = smartContract.methods[functionName];
    transactionData["data"] = (typeof params === "object") ? execFunction(...params).encodeABI() : ((params) ? execFunction(params).encodeABI() : execFunction().encodeABI());
    let signedTransaction = await web3.eth.accounts.signTransaction(transactionData, senderPK);
    let transactionReceipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
    return transactionReceipt.status;
};

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const main = async () => {
    baseTransaction["chainId"] = await web3.eth.getChainId();
    Object.freeze(baseTransaction);
    const bnbAmount = process.env["bnbAmount"];
    const iterationDuration = parseInt(process.env["iterationDuration"]);
    const iterationCounts = parseInt(process.env["iterationCounts"]);

    console.log("bnbAmount, iterationDuration, iterationCounts");
    console.log(bnbAmount, iterationDuration, iterationCounts);

    for (let i = 0; i < iterationCounts; i++) {
        console.log(await sendTransactionToBlockchain(senderPK, "generateVolume", [bnbAmount]));
        await delay(iterationDuration);
    }
};

main().then();

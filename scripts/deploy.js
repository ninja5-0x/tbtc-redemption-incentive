async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const TBTC_DEPOSIT_TOKEN_ADDRESS = "0x10b66bd1e3b5a936b7f8dbc5976004311037cdf0"
  const DepositRedemptionIncentive = await ethers.getContractFactory("DepositRedemptionIncentive");
  const DepositRedemptionIncentiveFactory = await ethers.getContractFactory("DepositRedemptionIncentiveFactory");
  const implementation = await DepositRedemptionIncentive.deploy();
  const factory = depositRedemptionIncentiveFactory = await DepositRedemptionIncentiveFactory.deploy(implementation.address, TBTC_DEPOSIT_TOKEN_ADDRESS);

  console.log("Implementation address:", implementation.address);
  console.log("Factory address:", factory.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

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

  // Verify contracts
  console.log("Verifying contracts on etherscan, please wait a moment");
  await new Promise(resolve => setTimeout(resolve, 30000));

  await hre.run("verify:verify", {
    address: implementation.address,
    constructorArguments: [],
  });

  await hre.run("verify:verify", {
    address: factory.address,
    constructorArguments: [implementation.address, TBTC_DEPOSIT_TOKEN_ADDRESS],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

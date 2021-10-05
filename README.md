# TBTC Redemption Incentive

A smart contract for providing incentives for redeeming specific tbtc deposits
with the goal of allowing KEEP ECDSA node operators to incentivize the
redemption of deposits they have created, and free up ETH for unstaking.

Each redemption incentive is claimable by the owner of the underlying TDT
(typically the redeemer) once the deposit is in a finalized state (REDEEMED or
LIQUIDATED). The owner of the incentive can optionally choose to cancel their
incentive at any time, at which point a ~7 day timer starts. At the end of
these 7 days, the incentive owner can receive the incentive they provided back.
This ensures any in process redemptions still receive their promised bonuses.

## Setup

Make sure the `ALCHEMY_API_KEY` environment variable is set to an api key.

```
npm install
```

## Usage

### Tests

```
npx hardhat test
```

### Deploying

Set the appropriate environment variables (`ALCHEMY_API_KEY`, `ETHERSCAN_API_KEY`, `ROPSTEN_PRIVATE_KEY`).

```
npx hardhat run --network ropsten scripts/deploy.js 
```

### Ropsten Deployment

* [DepositRedemptionIncentiveFactory](https://ropsten.etherscan.io/address/0x0dc31DB96cC956c0b9107F14516482670b4Bc0b0)
* [DepositRedemptionIncentive](https://ropsten.etherscan.io/address/0xCBd768EC753025b88aF6364BA9b33053a013b7FA)

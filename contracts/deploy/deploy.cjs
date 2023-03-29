module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("ENSChainLetter", {
    from: deployer,
    gasLimit: 4000000,
    args: [
      "0x4c97b24648b7fba93ef585ea705a7e1aee6e01b60c6e9191dc8b4e0bab86b399",
    ],
  });
};

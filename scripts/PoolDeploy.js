module.exports = async function ({
    getNamedAccounts,
    deployments,
    getContract
}) {
    const {
        deploy
    } = deployments;

    const {
        deployer
    } = await getNamedAccounts();

    const pToken = getContract("PToken");
    const usdtAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

    await deploy("Pool", {
        from: deployer,
        args: [usdtAddress, pToken.address],
        log: true
    });
}

module.exports.tags = ["Pool"];
module.exports.dependencies = ["PToken"];
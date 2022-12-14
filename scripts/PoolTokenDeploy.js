module.exports = async function ({
    getNamedAccounts,
    deployments
}) {
    const {
        deploy
    } = deployments;

    const {
        deployer
    } = await getNamedAccounts();


    await deploy("Pool", {
        from: deployer,
        log: true
    });
}

module.exports.tags = ["PToken"];
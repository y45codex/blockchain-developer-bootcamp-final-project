var DAC = artifacts.require("DAC");

module.exports = async function(deployer, network, accounts) {
    if (network == "live") {
        
    } else {
        const min_founder_count     = 2;
        const membership_stake      = web3.utils.toWei('0.1', 'ether');
        const proposal_fee          = web3.utils.toWei('0.01', 'ether');
        const support_fee           = web3.utils.toWei('0.001', 'ether');
        const proposal_polling_time = 120; // seconds
        const bill_polling_time     = 120; // seconds

        await deployer.deploy(
            DAC, 
            web3.utils.toBN(min_founder_count),
            web3.utils.toBN(membership_stake),
            web3.utils.toBN(proposal_fee),
            web3.utils.toBN(support_fee),
            web3.utils.toBN(proposal_polling_time),
            web3.utils.toBN(bill_polling_time)
        );
    }
};

var DAC = artifacts.require("DAC");

module.exports = async function(deployer, network, accounts) {
    if (network == "live") {
        
    } else {
        const min_founder_count = 2;
        const membership_stake = web3.utils.toWei('2', 'ether');
        const proposal_fee = web3.utils.toWei('0.5', 'ether');
        const support_fee = web3.utils.toWei('0.25', 'ether');
        const proposal_polling_time = 3; // 3 seconds
        const bill_polling_time = 3; // 3 seconds

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

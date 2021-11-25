const { catchRevert, tryCatch } = require("./exceptionsHelpers.js");

var DAC = artifacts.require("DAC");

const min_founder_count = 2;
const membership_stake = web3.utils.toWei('0.1', 'ether');
const proposal_fee = web3.utils.toWei('0.01', 'ether');
const support_fee = web3.utils.toWei('0.001', 'ether');
const insufficient_stake = membership_stake - web3.utils.toWei('0.05', 'ether');
const proposal_polling_time = 3;
const bill_polling_time = 3;


contract("DAC", accounts => {
    const [contractOwner, member_1] = accounts;
    let instance;

    beforeEach(async () => {
        instance = await DAC.new(
            web3.utils.toBN(min_founder_count),
            web3.utils.toBN(membership_stake),
            web3.utils.toBN(proposal_fee),
            web3.utils.toBN(support_fee),
            web3.utils.toBN(proposal_polling_time),
            web3.utils.toBN(bill_polling_time)
        );
    });

    it("Should test!", async() => {
        const eth100 = 100e18;
        assert.equal(await web3.eth.getBalance(member_1), eth100.toString());
    });

    it("is owned by owner", async () => {
        assert.equal(
            await instance.owner.call(),
            contractOwner,
            "owner is not correct",
        );
    });

    it("should register successfully", async() => {
        await instance.register({from: member_1, value: membership_stake});
        assert.equal(await instance.population(), 1, "population is not increased");
        assert.isTrue(await instance.isMember(member_1), "registration failed");
    });

    it("should fail to register", async() => {
        await catchRevert(instance.register({from: member_1, value: insufficient_stake}));
    });

    it("should fail to register if already a member", async() => {
        await instance.register({from: member_1, value: membership_stake});
        await catchRevert(instance.register({from: member_1, value: membership_stake}));
    });

    it("should be able to leave", async() => {
        await instance.register({from: member_1, value: membership_stake});
        assert.isTrue(await instance.isMember(member_1), "registration failed");
        assert.equal(await instance.population(), 1, "population is not increased");
        await instance.leave({from: member_1});
        assert.equal(await instance.isMember(member_1), false, "failed to leave");
        assert.equal(await instance.population(), 0, "population is not decreased");
        
    });

    it("should not be allowed to register after leaving", async() => {
        await instance.register({from: member_1, value: membership_stake});
        assert.isTrue(await instance.isMember(member_1), "registration failed");

        await instance.leave({from: member_1});
        assert.equal(await instance.isMember(member_1), false, "failed to leave");

        await catchRevert(instance.register({from: member_1, value: membership_stake}));
    });

    it("should not be able to submit a proposal if community population is not enough", async() => {
        assert.equal(await instance.population(), 0, "population is not zero");
        await instance.register({from: member_1, value: membership_stake});
        assert.equal(await instance.population(), 1, "population is not increased");

        await catchRevert(instance.propose("A Sample proposal", {from: member_1}));
    });
});

contract("DAC - Proposals", accounts => {
    const [contractOwner, member_1, member_2, member_3, member_4, member_5, not_a_member, stranger] = accounts;
    let instance;
    let proposal_id = 0;

    beforeEach(async () => {
        instance = await DAC.new(
            web3.utils.toBN(min_founder_count),
            web3.utils.toBN(membership_stake),
            web3.utils.toBN(proposal_fee),
            web3.utils.toBN(support_fee),
            web3.utils.toBN(proposal_polling_time),
            web3.utils.toBN(bill_polling_time)
        );
        assert.equal(await instance.population(), 0, "population is not zero");
        await instance.register({from: member_1, value: membership_stake});
        await instance.register({from: member_2, value: membership_stake});
        await instance.register({from: member_3, value: membership_stake});
        await instance.register({from: member_4, value: membership_stake});
        await instance.register({from: member_5, value: membership_stake});
        await instance.register({from: stranger, value: membership_stake});
        await instance.leave({from: stranger});
    });

    it("should not be able to submit a proposal if proposal fee is not provided", async() => {
        await tryCatch(
            instance.propose("A Sample proposal", {from: member_1}),
            "revert Wrong Proposal fee provided."
        );
    });

    it("should not be able to submit a proposal if not a member", async() => {
        await tryCatch(
            instance.propose("A Sample proposal", {from: not_a_member, value: proposal_fee}),
            "revert Must be a community member"
        );
    });

    it("should not be able to submit a proposal if a stranger", async() => {
        await tryCatch(
            instance.propose("A Sample proposal", {from: stranger, value: proposal_fee}),
            "revert Must be a community member"
        );
    });

    it("should be able to submit a proposal", async() => {
        await instance.propose("A Sample proposal", {from: member_2, value: proposal_fee});

        const proposal = await instance.fetchProposal(proposal_id);

        assert.equal(proposal.body, "A Sample proposal", "Failed to submit a proposal.");
        assert.equal(proposal.sponsor, member_2, "Failed to submit a proposal.");
    });
});

contract("DAC - Support Proposals", accounts => {
    const [contractOwner, member_1, member_2, member_3, member_4, member_5, not_a_member, stranger] = accounts;
    let instance;
    let proposal_id = 0;

    beforeEach(async () => {
        instance = await DAC.new(
            web3.utils.toBN(min_founder_count),
            web3.utils.toBN(membership_stake),
            web3.utils.toBN(proposal_fee),
            web3.utils.toBN(support_fee),
            web3.utils.toBN(proposal_polling_time),
            web3.utils.toBN(bill_polling_time)
        );
        assert.equal(await instance.population(), 0, "population is not zero");
        await instance.register({from: member_1, value: membership_stake});
        await instance.register({from: member_2, value: membership_stake});
        await instance.register({from: member_3, value: membership_stake});
        await instance.register({from: member_4, value: membership_stake});
        await instance.register({from: member_5, value: membership_stake});
        await instance.register({from: stranger, value: membership_stake});
        await instance.leave({from: stranger});
        await instance.propose("A Sample proposal", {from: member_1, value: proposal_fee});
    });

    it("should not be able to support a proposal if not a member", async() => {
        await tryCatch(
            instance.support(proposal_id, {from: not_a_member, value: support_fee}),
            "revert Must be a community member"
        );
    });

    it("should not be able to support a proposal if a stranger", async() => {
        await tryCatch(
            instance.support(proposal_id, {from: stranger, value: support_fee}),
            "revert Must be a community member"
        );
    });

    it("should not be able to support if support fee is not provided", async() => {
        await tryCatch(
            instance.support(proposal_id, {from: member_2, value: 0}),
            "revert Wrong Support fee provided"
        );
    });

    it("should be able to support a proposal", async() => {
        await instance.support(proposal_id, {from: member_2, value: support_fee});
        const is_supported = await instance.isSupported(proposal_id, {from: member_2});

        assert.isTrue(is_supported, "Proposal is not supported")
    });

    it("should not be able to support one proposal twice", async() => {
        await instance.propose("A Second proposal", {from: member_1, value: proposal_fee});

        await instance.support(1, {from: member_2, value: support_fee});

        await tryCatch(
            instance.support(1, {from: member_2, value: support_fee}),
            "revert You've already supported this proposal"
        );
    });

    it("should not be able to support a proposal after polling time is over", async() => {
        await new Promise(resolve => setTimeout(resolve, proposal_polling_time * 2000));

        await tryCatch(
            instance.support(proposal_id, {from: member_2, value: support_fee}),
            "revert Polling time is over"
        );
    });

    it("should accept the proposal after support from half of the community", async() => {
        const bill_id = 0;

        await instance.support(proposal_id, {from: member_2, value: support_fee});
        await instance.support(proposal_id, {from: member_3, value: support_fee});

        proposal = await instance.fetchProposal(proposal_id);
        assert.equal(proposal.status, 0);

        await instance.support(proposal_id, {from: member_4, value: support_fee});
        proposal = await instance.fetchProposal(proposal_id);

        assert.equal(proposal.status, 2);

        const bill = await instance.fetchBill(bill_id);

        assert.equal(bill.body, "A Sample proposal", "Failed to create a bill from the proposal");
        assert.equal(bill.sponsor, member_1, "Failed to create a bill from the proposal");
    });
});

contract("DAC - Vote for Bills", accounts => {
    const [member_1, member_2, member_3, member_4, member_5, not_a_member, stranger] = accounts;
    let instance;
    const bill_id = 0;
    const proposal_id = 1;

    beforeEach(async () => {
        instance = await DAC.new(
            web3.utils.toBN(min_founder_count),
            web3.utils.toBN(membership_stake),
            web3.utils.toBN(proposal_fee),
            web3.utils.toBN(support_fee),
            web3.utils.toBN(proposal_polling_time),
            web3.utils.toBN(bill_polling_time)
        );
        await instance.register({from: member_1, value: membership_stake});
        await instance.register({from: member_2, value: membership_stake});
        await instance.register({from: member_3, value: membership_stake});
        await instance.register({from: member_4, value: membership_stake});
        await instance.register({from: member_5, value: membership_stake});
        await instance.register({from: stranger, value: membership_stake});

        await instance.leave({from: stranger});

        await instance.propose("Idea 1", {from: member_1, value: proposal_fee}); // proposal 0
        await instance.propose("Idea 2", {from: member_1, value: proposal_fee}); // proposal 1
        

        // Support Proposal 1 to be Accepted and result in a Bill
        await instance.support(proposal_id, {from: member_2, value: support_fee});
        await instance.support(proposal_id, {from: member_3, value: support_fee});
        await instance.support(proposal_id, {from: member_4, value: support_fee});
    });

    it("should not be able to vote for a bill if not a member", async() => {
        await tryCatch(
            instance.vote(bill_id, true, "A Reason", {from: not_a_member}),
            "revert Must be a community member"
        );
    });

    it("should not be able to vote for a bill if a stranger", async() => {
        await tryCatch(
            instance.vote(bill_id, true, "A Reason", {from: stranger}),
            "revert Must be a community member"
        );
    });

    it("should be able to vote for a bill", async() => {
        await instance.vote(bill_id, true, "A Reason", {from: member_2});
        const is_voted = await instance.isVoted(bill_id, {from: member_2});

        assert.isTrue(is_voted.submitted, "Didn't vote for the bill");
        assert.isTrue(is_voted.yay, "Didn't vote for the bill");
        assert.equal(is_voted.reason, "A Reason", "Didn't vote for the bill");
    });

    it("should not be able to vote for one bill twice", async() => {
        await instance.vote(bill_id, true, "A Reason", {from: member_2});

        await tryCatch(
            instance.vote(bill_id, false, "A Reason", {from: member_2}),
            "revert You've already voted for this bill"
        );
    });

    it("should not be able to vote for a bill after polling time is over", async() => {
        await new Promise(resolve => setTimeout(resolve, bill_polling_time * 2000));

        await tryCatch(
            instance.vote(bill_id, false, "A Reason", {from: member_5}),
            "revert Polling time is over"
        );
    });

    it("should reject the bill after nay votes pass the threshold", async() => {
        let bill = await instance.fetchBill(bill_id);
        assert.equal(bill.status, 0, "Bill is not in Polling State");

        await instance.vote(bill_id, false, "Member 1 Reason", {from: member_1});
        await instance.vote(bill_id, false, "Member 2 Reason", {from: member_2});

        bill = await instance.fetchBill(bill_id);

        assert.equal(bill.status, 1, "Bill is not Accepted");
    });

    it("should accept the bill after yay votes pass the threshold", async() => {
        await instance.vote(bill_id, true, "Member 1 Reason", {from: member_1});
        await instance.vote(bill_id, true, "Member 2 Reason", {from: member_2});
        await instance.vote(bill_id, true, "Member 3 Reason", {from: member_3});
        await instance.vote(bill_id, true, "Member 4 Reason", {from: member_4});

        const bill = await instance.fetchBill(bill_id);

        assert.equal(bill.status, 2, "Bill is not Accepted");
    });

    it("should create a principal from the bill after the bill is accepted", async() => {
        let bill = await instance.fetchBill(bill_id);
        assert.equal(bill.status, 0, "Bill is not in Polling State");

        await instance.vote(bill_id, true, "Member 1 Reason", {from: member_1});
        await instance.vote(bill_id, true, "Member 2 Reason", {from: member_2});
        await instance.vote(bill_id, true, "Member 3 Reason", {from: member_3});
        await instance.vote(bill_id, true, "Member 4 Reason", {from: member_4});

        bill = await instance.fetchBill(bill_id);

        assert.equal(bill.status, 2, "Bill is not Accepted");

        const principal = await instance.fetchPrincipal(0);

        assert.equal(principal.id, 0, "Principal is not created");
        assert.equal(principal.bill_id, bill_id, "Principal is not created");
    });
});
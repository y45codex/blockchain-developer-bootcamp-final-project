# blockchain-developer-bootcamp-final-project

## Decentralized Autonomous Community

### Membership flow
- A user must connect to their MetaMask wallet to be identified.
- They must lock in a certain amount (Membership Stake) to join the community and become a "Member"
- If Members request to leave:
  - Their locked Membership Stake is released
  - They are no longer recognised as a member and are marked as strangers 
  - Once a stranger, always a stranger (A stranger may not become a member again)

### Proposal flow
- Once the population of the community reach a certain size (Min Founder Count), any Member can submit a Proposal for a "Principal", with a fee (Proposal Fee) 
- Members can support any Proposal, with a fee (Support Fee)
- If a Proposal doesn't reach a certain level of support proportional to the population of the community (Bill Threshold) in a certain time window (Proposal Polling Time) it is considered a Failed Proposal.

### Bill flow
- A Proposal is accepted and results in a Bill once it reaches a certain level of support proportional to the size of the community (Bill Threshold) in a certain time window (Proposal Polling Time)
- Once a Bill is created from a Proposal, all members can vote on accepting the Bill as a Principal (no fee) in a certain time window (Bill Polling Time)
- Votes can only be Yay (true) or Nay (false).
- When voting, Members can also offer a "Reason" for their vote.
- If the number of Yay votes on a Bill reaches two thirds of the population of the community during the fixed "Bill Polling Time", it is accepted as a "Principal", otherwise it is rejected.







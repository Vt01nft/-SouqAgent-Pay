// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
}

contract ArcJobEscrow {
    enum JobState {
        Created,
        Funded,
        Delivered,
        Released,
        Refunded
    }

    struct Job {
        address buyer;
        address seller;
        uint256 amount;
        string termsUri;
        string deliverableUri;
        JobState state;
    }

    IERC20 public immutable usdc;
    uint256 public nextJobId = 1;
    mapping(uint256 => Job) public jobs;

    event JobCreated(uint256 indexed jobId, address indexed buyer, address indexed seller, uint256 amount, string termsUri);
    event JobFunded(uint256 indexed jobId, uint256 amount);
    event DeliverableSubmitted(uint256 indexed jobId, string deliverableUri);
    event JobReleased(uint256 indexed jobId, address indexed seller, uint256 amount);
    event JobRefunded(uint256 indexed jobId, address indexed buyer, uint256 amount);

    modifier onlyBuyer(uint256 jobId) {
        require(msg.sender == jobs[jobId].buyer, "Only buyer");
        _;
    }

    modifier onlySeller(uint256 jobId) {
        require(msg.sender == jobs[jobId].seller, "Only seller");
        _;
    }

    constructor(address usdcAddress) {
        require(usdcAddress != address(0), "USDC required");
        usdc = IERC20(usdcAddress);
    }

    function createJob(address seller, uint256 amount, string calldata termsUri) external returns (uint256 jobId) {
        require(seller != address(0), "Seller required");
        require(amount > 0, "Amount required");

        jobId = nextJobId++;
        jobs[jobId] = Job({
            buyer: msg.sender,
            seller: seller,
            amount: amount,
            termsUri: termsUri,
            deliverableUri: "",
            state: JobState.Created
        });

        emit JobCreated(jobId, msg.sender, seller, amount, termsUri);
    }

    function fundJob(uint256 jobId) external onlyBuyer(jobId) {
        Job storage job = jobs[jobId];
        require(job.state == JobState.Created, "Invalid state");
        require(usdc.transferFrom(msg.sender, address(this), job.amount), "USDC transfer failed");
        job.state = JobState.Funded;
        emit JobFunded(jobId, job.amount);
    }

    function submitDeliverable(uint256 jobId, string calldata deliverableUri) external onlySeller(jobId) {
        Job storage job = jobs[jobId];
        require(job.state == JobState.Funded, "Invalid state");
        job.deliverableUri = deliverableUri;
        job.state = JobState.Delivered;
        emit DeliverableSubmitted(jobId, deliverableUri);
    }

    function release(uint256 jobId) external onlyBuyer(jobId) {
        Job storage job = jobs[jobId];
        require(job.state == JobState.Funded || job.state == JobState.Delivered, "Invalid state");
        job.state = JobState.Released;
        require(usdc.transfer(job.seller, job.amount), "USDC transfer failed");
        emit JobReleased(jobId, job.seller, job.amount);
    }

    function refund(uint256 jobId) external onlyBuyer(jobId) {
        Job storage job = jobs[jobId];
        require(job.state == JobState.Funded, "Invalid state");
        job.state = JobState.Refunded;
        require(usdc.transfer(job.buyer, job.amount), "USDC transfer failed");
        emit JobRefunded(jobId, job.buyer, job.amount);
    }
}

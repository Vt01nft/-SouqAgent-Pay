import React from "react";
import ReactDOM from "react-dom/client";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  Gauge,
  Landmark,
  LockKeyhole,
  Network,
  ReceiptText,
  Search,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import "./styles.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8787";

type Service = {
  id: string;
  name: string;
  category: string;
  price: number;
  speed: string;
  trust: number;
  description: string;
};

type Receipt = {
  id: string;
  label: string;
  rail: string;
  amount: string;
  status: string;
  timestamp: string;
};

type TimelineEvent = {
  icon: React.ElementType;
  title: string;
  detail: string;
  meta: string;
};

type AgentRun = {
  taskId: string;
  mode: string;
  selectedService: string;
  steps: {
    id: string;
    title: string;
    detail: string;
    status: string;
  }[];
  payment: {
    protocol: string;
    rail: string;
    amount: string;
    status: string;
    authorization: string;
  };
  result: {
    vendor: string;
    riskScore: number;
    summary: string;
    recommendation: string;
  };
  arcEscrow: {
    jobId: string;
    amount: string;
    state: string;
    contract: string;
  };
  receipts: Receipt[];
};

type Readiness = {
  mode: string;
  demoReady: boolean;
  testnetReady: boolean;
  missing: string[];
  arc: {
    rpcUrl: string;
    explorerUrl: string;
    usdcAddress: string;
    jobEscrowAddress: string;
  };
  circle: {
    apiKeyConfigured: boolean;
    walletSetConfigured: boolean;
    ownerWalletConfigured: boolean;
    agentWalletConfigured: boolean;
  };
};

const services: Service[] = [
  {
    id: "kyb-a",
    name: "Gulf KYB Pulse",
    category: "Supplier Risk",
    price: 0.0042,
    speed: "480 ms",
    trust: 98,
    description: "Sanctions, registry, payment-history, and adverse-media summary.",
  },
  {
    id: "freight-b",
    name: "PortRate Oracle",
    category: "Trade Quote",
    price: 0.0018,
    speed: "310 ms",
    trust: 92,
    description: "Live freight estimate for UAE import/export corridors.",
  },
  {
    id: "fx-c",
    name: "Stable Route Quote",
    category: "Settlement Routing",
    price: 0.0009,
    speed: "190 ms",
    trust: 89,
    description: "Best chain and payout path for USDC settlement.",
  },
];

const receipts: Receipt[] = [
  {
    id: "R-402-0842",
    label: "Supplier-risk API access",
    rail: "Gateway Nanopayment / x402",
    amount: "0.0042 USDC",
    status: "Verified",
    timestamp: "12:08:14",
  },
  {
    id: "ARC-JOB-117",
    label: "Vendor document review escrow",
    rail: "Arc USDC Job Escrow",
    amount: "14.00 USDC",
    status: "Ready to release",
    timestamp: "12:10:03",
  },
  {
    id: "GW-BAL-009",
    label: "Agent spend allocation",
    rail: "Circle Gateway Balance",
    amount: "25.00 USDC",
    status: "Active",
    timestamp: "12:05:41",
  },
];

const timeline: TimelineEvent[] = [
  {
    icon: Search,
    title: "Discovered paid services",
    detail: "Agent compared three x402-compatible service listings.",
    meta: "policy: supplier-risk",
  },
  {
    icon: ShieldCheck,
    title: "Budget policy passed",
    detail: "Payment is under the 0.01 USDC autonomous approval cap.",
    meta: "cap: 0.01 USDC",
  },
  {
    icon: LockKeyhole,
    title: "402 challenge received",
    detail: "Seller required a Gateway-compatible payment authorization.",
    meta: "HTTP 402",
  },
  {
    icon: CircleDollarSign,
    title: "Nanopayment signed",
    detail: "Agent created an offchain authorization for batched settlement.",
    meta: "0 gas per call",
  },
  {
    icon: FileCheck2,
    title: "Paid data delivered",
    detail: "Supplier risk score, registry proof, and receipt attached.",
    meta: "480 ms",
  },
];

function App() {
  const [agentRun, setAgentRun] = React.useState<AgentRun | null>(null);
  const [readiness, setReadiness] = React.useState<Readiness | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);

  React.useEffect(() => {
    fetch(`${API_BASE_URL}/api/readiness`)
      .then((response) => response.json())
      .then((data: Readiness) => setReadiness(data))
      .catch(() => setReadiness(null));
  }, []);

  async function runDemoFlow() {
    setIsRunning(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/agent/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor: "Al Noor Components",
          maxAutonomousSpend: "0.01 USDC",
        }),
      });
      const data = (await response.json()) as AgentRun;
      setAgentRun(data);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <main>
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">
            <img src="/logo-mark.svg" alt="" />
          </div>
          <div>
            <strong>SouqAgent Pay</strong>
            <span>Arc agent commerce</span>
          </div>
        </div>
        <nav>
          <a className="active" href="#console">
            <Bot size={18} /> Console
          </a>
          <a href="#receipts">
            <ReceiptText size={18} /> Receipts
          </a>
          <a href="#architecture">
            <Network size={18} /> Architecture
          </a>
          <a href="#feedback">
            <BadgeCheck size={18} /> Feedback
          </a>
        </nav>
        <div className="trackCard">
          <span>Challenge Track</span>
          <strong>Best Agentic Economy Experience on Arc</strong>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">UAE/GCC SME spending desk</p>
            <h1>AI agents that can spend USDC with controls, receipts, and settlement proof.</h1>
          </div>
          <button className="primaryButton" disabled={isRunning} onClick={runDemoFlow}>
            {isRunning ? "Running..." : "Run demo flow"} <ArrowRight size={18} />
          </button>
        </header>

        <section id="console" className="grid consoleGrid">
          <div className="panel taskPanel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Active instruction</p>
                <h2>Find a supplier-risk check and pay only if it is below budget.</h2>
              </div>
              <Bot className="panelIcon" />
            </div>
            <div className="promptBox">
              <span>Owner request</span>
              <p>
                Check Al Noor Components before releasing the next vendor milestone.
                Use a paid data source if the total cost is under 0.01 USDC.
              </p>
            </div>
            <div className="metrics">
              <Metric icon={WalletCards} label="Gateway balance" value="25.00 USDC" />
              <Metric icon={Gauge} label="Autonomous cap" value="0.01 USDC" />
              <Metric icon={Landmark} label="Escrow ready" value="14.00 USDC" />
            </div>
            {agentRun && (
              <div className="resultBox">
                <div>
                  <span>Agent result</span>
                  <strong>{agentRun.selectedService} paid and delivered</strong>
                </div>
                <p>{agentRun.result.summary}</p>
                <div className="resultChips">
                  <span>Risk score {agentRun.result.riskScore}</span>
                  <span>{agentRun.payment.amount}</span>
                  <span>{agentRun.arcEscrow.jobId} {agentRun.arcEscrow.state}</span>
                </div>
              </div>
            )}
          </div>

          <div className="panel policyPanel">
            <div className="panelHeader compact">
              <h2>Policy Guardrails</h2>
              <ShieldCheck className="panelIcon" />
            </div>
            <Policy label="Allowed categories" value="KYB, freight, settlement routing" />
            <Policy label="Human approval" value="Required above 0.01 USDC" />
            <Policy label="Settlement rail" value="Gateway nanopayments first, Arc escrow for jobs" />
            <Policy label="Compliance mode" value="Testnet demo, no real funds" />
          </div>
        </section>

        {readiness && (
          <section className="panel readinessPanel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Product readiness</p>
                <h2>{readiness.testnetReady ? "Ready for testnet operation" : "Demo-ready, waiting on live credentials"}</h2>
              </div>
              <ShieldCheck className="panelIcon" />
            </div>
            <div className="readinessGrid">
              <ReadinessCard label="Mode" value={readiness.mode} status={readiness.demoReady ? "online" : "blocked"} />
              <ReadinessCard label="Arc RPC" value={readiness.arc.rpcUrl} status="online" />
              <ReadinessCard
                label="Circle Wallets"
                value={readiness.circle.agentWalletConfigured ? "configured" : "missing wallet IDs"}
                status={readiness.circle.agentWalletConfigured ? "online" : "needed"}
              />
              <ReadinessCard
                label="Escrow contract"
                value={readiness.arc.jobEscrowAddress}
                status={readiness.arc.jobEscrowAddress === "not-configured" ? "needed" : "online"}
              />
            </div>
            {!readiness.testnetReady && (
              <p className="missingText">Needed for testnet: {readiness.missing.join(", ")}</p>
            )}
          </section>
        )}

        <section className="grid serviceGrid">
          {services.map((service) => (
            <article className="serviceCard" key={service.id}>
              <div>
                <span>{service.category}</span>
                <h3>{service.name}</h3>
                <p>{service.description}</p>
              </div>
              <div className="serviceMeta">
                <strong>{service.price.toFixed(4)} USDC</strong>
                <span>{service.speed}</span>
                <span>{service.trust}% trust</span>
              </div>
            </article>
          ))}
        </section>

        <section className="grid lowerGrid">
          <div className="panel">
            <div className="panelHeader compact">
              <h2>Agent Execution Trace</h2>
              <CheckCircle2 className="panelIcon" />
            </div>
            <div className="timeline">
              {timeline.map((event) => (
                <div className="timelineItem" key={event.title}>
                  <event.icon size={18} />
                  <div>
                    <strong>{event.title}</strong>
                    <p>{event.detail}</p>
                  </div>
                  <span>{event.meta}</span>
                </div>
              ))}
            </div>
          </div>

          <div id="receipts" className="panel">
            <div className="panelHeader compact">
              <h2>Receipts</h2>
              <ReceiptText className="panelIcon" />
            </div>
            <div className="receiptList">
              {receipts.map((receipt) => (
                <div className="receipt" key={receipt.id}>
                  <div>
                    <strong>{receipt.label}</strong>
                    <span>{receipt.id} · {receipt.rail}</span>
                  </div>
                  <div>
                    <b>{receipt.amount}</b>
                    <span>{receipt.status} · {receipt.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {agentRun && (
          <section className="panel runPanel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Live demo output</p>
                <h2>{agentRun.taskId} completed in {agentRun.mode} mode</h2>
              </div>
              <CircleDollarSign className="panelIcon" />
            </div>
            <div className="runGrid">
              {agentRun.steps.map((step) => (
                <article className="runStep" key={step.id}>
                  <span>{step.status}</span>
                  <strong>{step.title}</strong>
                  <p>{step.detail}</p>
                </article>
              ))}
            </div>
            <div className="settlementStrip">
              <div>
                <span>x402 authorization</span>
                <strong>{agentRun.payment.authorization}</strong>
              </div>
              <div>
                <span>Arc escrow contract</span>
                <strong>{agentRun.arcEscrow.contract}</strong>
              </div>
              <div>
                <span>Recommendation</span>
                <strong>{agentRun.result.recommendation}</strong>
              </div>
            </div>
          </section>
        )}

        <section id="architecture" className="panel architecture">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Submission diagram</p>
              <h2>Circle and Arc commerce stack</h2>
            </div>
            <Network className="panelIcon" />
          </div>
          <div className="architectureFlow">
            <FlowBox icon={Bot} title="AI buyer agent" text="Plans, compares services, checks budget." />
            <FlowBox icon={WalletCards} title="Circle Wallets" text="Embedded user and agent wallet layer." />
            <FlowBox icon={CircleDollarSign} title="Gateway + x402" text="Gas-free nanopayment authorizations." />
            <FlowBox icon={Banknote} title="Arc escrow" text="USDC job lifecycle and settlement events." />
            <FlowBox icon={ReceiptText} title="Audit trail" text="Receipts, policies, product feedback." />
          </div>
        </section>

        <section id="feedback" className="panel feedback">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Circle Product Feedback</p>
              <h2>Early notes for the required submission section</h2>
            </div>
            <BadgeCheck className="panelIcon" />
          </div>
          <div className="feedbackGrid">
            <Feedback title="Why these products" text="Gateway and Nanopayments match high-frequency agent purchases; Wallets simplify key handling; Arc gives stable USDC-denominated settlement." />
            <Feedback title="What works well" text="The x402 mental model is excellent for paid APIs because payment requirements travel with the resource request." />
            <Feedback title="Improve next" text="Hackathon teams need a single Arc + Gateway + Nanopayments quickstart with seeded test wallets and end-to-end receipts." />
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="metric">
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Policy({ label, value }: { label: string; value: string }) {
  return (
    <div className="policy">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FlowBox({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
  return (
    <div className="flowBox">
      <Icon size={22} />
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function Feedback({ title, text }: { title: string; text: string }) {
  return (
    <article className="feedbackItem">
      <strong>{title}</strong>
      <p>{text}</p>
    </article>
  );
}

function ReadinessCard({ label, value, status }: { label: string; value: string; status: string }) {
  return (
    <article className="readinessCard">
      <span>{label}</span>
      <strong>{value}</strong>
      <b className={`statusPill ${status}`}>{status}</b>
    </article>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Bitcoin, Copy, ExternalLink, Heart, Leaf, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const WALLET_ADDRESSES = [
  {
    id: "btc",
    label: "Bitcoin",
    symbol: "BTC",
    address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    Icon: Bitcoin,
    color: "text-amber-400",
  },
  {
    id: "eth",
    label: "Ethereum / USDC",
    symbol: "ETH",
    address: "0x742d35Cc6634C0532925a3b8D4C9b9eC7e4D3C01",
    Icon: Zap,
    color: "text-blue-400",
  },
  {
    id: "icp",
    label: "Internet Computer",
    symbol: "ICP",
    address: "a4gq2-l2k4z-kxjmd-p7x5b-prkqo-3epbm-j2nla-hvjrr-ftzqw",
    Icon: Leaf,
    color: "text-primary",
  },
];

const PRESET_AMOUNTS = ["5", "10", "25", "50", "100"];

const TIERS = [
  {
    id: "seedling",
    name: "Seedling",
    amount: "$5",
    emoji: "🌱",
    description: "Keep the lights on — cover hosting costs for a day.",
  },
  {
    id: "sprout",
    name: "Sprout",
    amount: "$25",
    emoji: "🌿",
    description: "Fund a new feature — direct messaging improvements, filters.",
  },
  {
    id: "bloomer",
    name: "Bloomer",
    amount: "$100",
    emoji: "🌸",
    description: "Sponsor a full sprint — shape the roadmap with your support.",
  },
];

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success(`${label} address copied!`);
  });
}

interface WalletCardProps {
  id: string;
  label: string;
  symbol: string;
  address: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
}

function WalletCard({ label, symbol, address, Icon, color }: WalletCardProps) {
  return (
    <Card className="bg-card border-border hover:border-primary/40 transition-smooth">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <p className="font-display font-semibold text-foreground text-sm">
              {label}
            </p>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {symbol}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-muted/60 rounded-lg px-3 py-2">
          <p className="text-xs text-muted-foreground font-mono flex-1 truncate min-w-0">
            {address}
          </p>
          <button
            type="button"
            onClick={() => copyToClipboard(address, symbol)}
            className="text-muted-foreground hover:text-primary transition-smooth flex-shrink-0"
            aria-label={`Copy ${symbol} address`}
            data-ocid={`donate-copy-${symbol.toLowerCase()}`}
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DonationPage() {
  const [selectedAmount, setSelectedAmount] = useState("10");
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const displayAmount = customAmount || selectedAmount;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayAmount || Number(displayAmount) <= 0) {
      toast.error("Please enter a valid donation amount.");
      return;
    }
    toast.success(
      `Thank you for your $${displayAmount} support! 💚 Use the crypto addresses above to send.`,
    );
    setSubmitted(true);
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden">
          <img
            src="/assets/generated/donate-hero.dim_800x400.jpg"
            alt="Support 420 Social"
            className="w-full object-cover h-44 sm:h-56"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-5 h-5 text-primary fill-primary" />
              <span className="text-primary font-display font-bold text-sm uppercase tracking-widest">
                Support Us
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-foreground">
              Keep 420 Social Growing
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Your tips help fund new features, server costs, and the continued
              development of this community.
            </p>
          </div>
        </div>

        {/* Tiers */}
        <section>
          <h2 className="font-display font-semibold text-foreground text-lg mb-3">
            Support Tiers
          </h2>
          <div className="grid gap-3">
            {TIERS.map((tier) => (
              <button
                key={tier.id}
                type="button"
                onClick={() => {
                  setSelectedAmount(tier.amount.replace("$", ""));
                  setCustomAmount("");
                }}
                className={`w-full text-left rounded-xl border p-4 transition-smooth focus-visible:ring-2 focus-visible:ring-ring ${
                  selectedAmount === tier.amount.replace("$", "") &&
                  !customAmount
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/40"
                }`}
                data-ocid={`donate-tier-${tier.id}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{tier.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-display font-semibold text-foreground">
                        {tier.name}
                      </p>
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                        {tier.amount}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mt-0.5">
                      {tier.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <Separator className="bg-border" />

        {/* Amount picker */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="font-display font-semibold text-foreground mb-3 block">
                Choose Amount (USD equivalent)
              </Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(amt);
                      setCustomAmount("");
                    }}
                    className={`px-4 py-2 rounded-lg border font-body text-sm font-medium transition-smooth focus-visible:ring-2 focus-visible:ring-ring ${
                      selectedAmount === amt && !customAmount
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                    data-ocid={`donate-preset-${amt}`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm font-body">
                  Or enter custom:
                </span>
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    type="number"
                    min="1"
                    placeholder="0"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount("");
                    }}
                    className="pl-7 bg-card border-border"
                    data-ocid="donate-custom-amount"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label
                htmlFor="donate-message"
                className="font-display font-semibold text-foreground mb-2 block"
              >
                Leave a message{" "}
                <span className="text-muted-foreground font-normal text-sm">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="donate-message"
                placeholder="Thanks for building this awesome platform! 💚"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={280}
                className="bg-card border-border resize-none"
                rows={3}
                data-ocid="donate-message"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {message.length}/280
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground font-display font-semibold text-base h-12"
              data-ocid="donate-submit"
            >
              <Heart className="w-5 h-5 mr-2 fill-current" />
              Donate ${displayAmount || "—"}
            </Button>
          </form>
        ) : (
          <div
            className="rounded-2xl bg-primary/10 border border-primary/30 p-6 text-center space-y-3"
            data-ocid="donate-success"
          >
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8 text-primary fill-primary" />
            </div>
            <h3 className="font-display font-bold text-xl text-foreground">
              Thank you! 💚
            </h3>
            <p className="text-muted-foreground text-sm">
              Your support means the world to us. Please use one of the crypto
              addresses below to complete your donation.
            </p>
            <Button
              variant="outline"
              className="border-primary/40 text-primary"
              onClick={() => setSubmitted(false)}
              data-ocid="donate-again"
            >
              Donate Again
            </Button>
          </div>
        )}

        <Separator className="bg-border" />

        {/* Crypto wallets */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-display font-semibold text-foreground text-lg">
              Send Crypto
            </h2>
            <Badge
              variant="outline"
              className="border-primary/30 text-primary text-xs"
            >
              No fees
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Send directly to these addresses — 100% goes to supporting the
            platform.
          </p>
          <div className="grid gap-3">
            {WALLET_ADDRESSES.map((wallet) => (
              <WalletCard key={wallet.id} {...wallet} />
            ))}
          </div>
        </section>

        {/* CashApp / Venmo */}
        <section>
          <h2 className="font-display font-semibold text-foreground text-lg mb-4">
            Other Ways to Support
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <a
              href="https://cash.app/$420Social"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-smooth"
              data-ocid="donate-cashapp"
            >
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-sm">$</span>
              </div>
              <div>
                <p className="font-display font-semibold text-foreground text-sm">
                  Cash App
                </p>
                <p className="text-xs text-muted-foreground">$420Social</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto flex-shrink-0" />
            </a>

            <a
              href="https://venmo.com/420Social"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-smooth"
              data-ocid="donate-venmo"
            >
              <div className="w-9 h-9 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-secondary font-bold text-sm">V</span>
              </div>
              <div>
                <p className="font-display font-semibold text-foreground text-sm">
                  Venmo
                </p>
                <p className="text-xs text-muted-foreground">@420Social</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto flex-shrink-0" />
            </a>
          </div>
        </section>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          All donations are voluntary tips to support platform development.
          <br />
          No goods or services are exchanged. Thank you for your generosity 💚
        </p>
      </div>
    </Layout>
  );
}

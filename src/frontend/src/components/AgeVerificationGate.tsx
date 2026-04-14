import { Button } from "@/components/ui/button";
import {
  MIN_AGE,
  isAgeValid,
  useAgeVerificationStore,
} from "@/stores/ageVerification";
import { useState } from "react";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => currentYear - i);

export function AgeVerificationGate() {
  const verify = useAgeVerificationStore((s) => s.verify);
  const [month, setMonth] = useState<string>("");
  const [day, setDay] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [blocked, setBlocked] = useState(false);

  function handleVerify() {
    setError("");
    if (!month || !day || !year) {
      setError("Please enter your complete date of birth.");
      return;
    }

    const m = Number.parseInt(month, 10);
    const d = Number.parseInt(day, 10);
    const y = Number.parseInt(year, 10);

    if (isAgeValid(m, d, y)) {
      verify();
    } else {
      setBlocked(true);
      setError(`You must be ${MIN_AGE} or older to access this platform.`);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
      data-ocid="age-gate"
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, oklch(0.65 0.19 142) 0%, transparent 50%), 
                           radial-gradient(circle at 80% 80%, oklch(0.72 0.23 102) 0%, transparent 50%)`,
        }}
      />

      <div className="relative w-full max-w-md mx-4">
        {/* Card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
          {/* Header bar */}
          <div className="bg-primary px-6 py-5 flex items-center gap-3">
            <CannabisLeafIcon className="w-10 h-10 text-primary-foreground flex-shrink-0" />
            <div>
              <h1 className="text-primary-foreground font-display font-bold text-2xl leading-tight">
                420 Social
              </h1>
              <p className="text-primary-foreground/80 text-xs font-body">
                Adults Only Platform
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-8">
            <div className="text-center mb-6">
              <h2 className="font-display font-bold text-xl text-foreground uppercase tracking-widest mb-2">
                Age Verification
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                To access 420 Social, you must be {MIN_AGE} or older. Please
                enter your date of birth to continue.
              </p>
            </div>

            {!blocked ? (
              <>
                <div className="mb-5">
                  <p className="block text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Date of Birth
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="bg-background border border-input rounded-lg px-3 py-2.5 text-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                      aria-label="Birth month"
                      data-ocid="age-month"
                    >
                      <option value="">MM</option>
                      {MONTHS.map((m, i) => (
                        <option key={m} value={i + 1}>
                          {String(i + 1).padStart(2, "0")}
                        </option>
                      ))}
                    </select>
                    <select
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      className="bg-background border border-input rounded-lg px-3 py-2.5 text-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                      aria-label="Birth day"
                      data-ocid="age-day"
                    >
                      <option value="">DD</option>
                      {DAYS.map((d) => (
                        <option key={d} value={d}>
                          {String(d).padStart(2, "0")}
                        </option>
                      ))}
                    </select>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="bg-background border border-input rounded-lg px-3 py-2.5 text-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                      aria-label="Birth year"
                      data-ocid="age-year"
                    >
                      <option value="">YYYY</option>
                      {YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <p className="text-destructive text-sm font-body text-center">
                      {error}
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleVerify}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold text-sm uppercase tracking-widest py-3 rounded-xl transition-smooth"
                  data-ocid="age-confirm"
                >
                  Confirm &amp; Enter
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                  <span className="text-3xl">🚫</span>
                </div>
                <h3 className="font-display font-bold text-foreground mb-2">
                  Access Restricted
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {error}
                </p>
                <p className="text-muted-foreground/60 text-xs mt-3">
                  This platform is for adults {MIN_AGE}+ only and contains
                  cannabis-related content.
                </p>
              </div>
            )}

            <p className="text-muted-foreground/50 text-xs text-center mt-5 leading-relaxed">
              By entering, you confirm you are {MIN_AGE}+ and agree to our
              Terms. This platform contains adult cannabis content.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CannabisLeafIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M12 2C12 2 6 6 6 11C6 13.5 7.5 15.5 9.5 16.5L9 19H11V22H13V19H15L14.5 16.5C16.5 15.5 18 13.5 18 11C18 6 12 2 12 2ZM12 4.5C12 4.5 8.5 7.5 8.5 11C8.5 12.5 9.2 13.8 10.3 14.6L10.8 14.1C9.8 13.4 9.2 12.3 9.2 11C9.2 8.1 12 5.5 12 5.5V4.5Z" />
      <path d="M3 9C3 9 1 12 3 15C4 16.5 5.5 17.2 7 17L7.5 15.5C6.3 15.7 5.1 15.1 4.3 14C3 12 4 9.5 4 9.5L3 9Z" />
      <path d="M21 9L20 9.5C20 9.5 21 12 19.7 14C18.9 15.1 17.7 15.7 16.5 15.5L17 17C18.5 17.2 20 16.5 21 15C23 12 21 9 21 9Z" />
    </svg>
  );
}

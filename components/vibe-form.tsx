"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Users, Wallet, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

interface VibeFormProps {
  onSubmit: (data: {
    vibe: string;
    budget_php: number;
    party_size: number;
    start_time: string;
    end_time: string;
  }) => void;
  isLoading: boolean;
}

const QUICK_VIBES = [
  "rainy day, want comfort food",
  "date night, something romantic",
  "with friends, fun and weird",
  "solo chill, coffee and art",
  "outdoor adventure, nature escape",
  "foodie crawl, best eats",
];

export function VibeForm({ onSubmit, isLoading }: VibeFormProps) {
  const [vibe, setVibe] = useState("");
  const [budget, setBudget] = useState(3000);
  const [partySize, setPartySize] = useState(2);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("22:00");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vibe.trim()) return;
    onSubmit({
      vibe,
      budget_php: budget,
      party_size: partySize,
      start_time: startTime,
      end_time: endTime,
    });
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      onSubmit={handleSubmit}
      className="w-full max-w-lg mx-auto space-y-6"
    >
      {/* Vibe Input */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground/80">
          What&apos;s your vibe?
        </label>
        <Textarea
          value={vibe}
          onChange={(e) => setVibe(e.target.value)}
          placeholder="rainy Saturday, ₱3000 budget, with my partner, want food and something weird..."
          className="min-h-[100px] text-base resize-none bg-card border-border/50 focus:border-primary/50 transition-colors"
        />
        
        {/* Quick Vibe Pills */}
        <div className="flex flex-wrap gap-2">
          {QUICK_VIBES.map((quickVibe) => (
            <button
              key={quickVibe}
              type="button"
              onClick={() => setVibe(quickVibe)}
              className="px-3 py-1.5 text-xs rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              {quickVibe}
            </button>
          ))}
        </div>
      </div>

      {/* Budget Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Budget per person
          </label>
          <span className="text-sm font-semibold text-primary">
            ₱{budget.toLocaleString()}
          </span>
        </div>
        <Slider
          value={[budget]}
          onValueChange={(value) => setBudget(value[0])}
          min={500}
          max={10000}
          step={500}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>₱500</span>
          <span>₱10,000</span>
        </div>
      </div>

      {/* Party Size */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Party size
          </label>
          <span className="text-sm font-semibold text-primary">
            {partySize} {partySize === 1 ? "person" : "people"}
          </span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6].map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setPartySize(size)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                partySize === size
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Time Range */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Time window
        </label>
        <div className="flex items-center gap-3">
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm"
          />
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!vibe.trim() || isLoading}
        className="w-full h-12 text-base font-semibold gap-2"
      >
        <Sparkles className="w-5 h-5" />
        {isLoading ? "Planning..." : "Plan my weekend"}
      </Button>
    </motion.form>
  );
}

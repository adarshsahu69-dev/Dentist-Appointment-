"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAYS = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

export function DentistFilters({
  specializations,
  clinics,
}: {
  specializations: string[];
  clinics: { id: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const debounce = useRef<number | null>(null);

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") params.set(key, value);
      else params.delete(key);
      router.push(`/dentists?${params.toString()}`);
    },
    [router, searchParams],
  );

  // Debounced search-as-you-type.
  useEffect(() => {
    if (debounce.current) window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => {
      update("q", query);
    }, 350);
    return () => {
      if (debounce.current) window.clearTimeout(debounce.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <form
      className="grid gap-4 rounded-xl border bg-white p-5 shadow-card sm:grid-cols-2 lg:grid-cols-4"
      onSubmit={(event) => event.preventDefault()}
      aria-label="Filter dentists"
    >
      <div className="space-y-1.5">
        <Label htmlFor="q">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="q"
            name="q"
            placeholder="Name or qualification"
            value={query}
            className="pl-9"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Specialization</Label>
        <Select value={searchParams.get("specialization") ?? "all"} onValueChange={(value) => update("specialization", value)}>
          <SelectTrigger>
            <SelectValue placeholder="All specializations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All specializations</SelectItem>
            {specializations.map((spec) => (
              <SelectItem key={spec} value={spec}>
                {spec}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Clinic location</Label>
        <Select value={searchParams.get("clinic_id") ?? "all"} onValueChange={(value) => update("clinic_id", value)}>
          <SelectTrigger>
            <SelectValue placeholder="All clinics" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All clinics</SelectItem>
            {clinics.map((clinic) => (
              <SelectItem key={clinic.id} value={clinic.id}>
                {clinic.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Available on</Label>
        <div className="flex gap-2">
          <Select value={searchParams.get("day") ?? "all"} onValueChange={(value) => update("day", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Any day" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any day</SelectItem>
              {DAYS.map((day) => (
                <SelectItem key={day.value} value={day.value}>
                  {day.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dentists")}
            aria-label="Reset filters"
            title="Reset filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </form>
  );
}

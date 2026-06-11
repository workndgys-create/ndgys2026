import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FAQ from "@/components/FAQ";

describe("FAQ", () => {
  it("renders the heading and first answer open by default", () => {
    render(<FAQ />);
    expect(screen.getByRole("heading", { name: /got questions/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { expanded: true })).toBeInTheDocument();
  });

  it("filters questions by category", () => {
    render(<FAQ />);
    fireEvent.click(screen.getByRole("button", { name: "Registration" }));
    expect(screen.getByText(/How do I register and pay/i)).toBeInTheDocument();
    expect(screen.queryByText(/How many tracks are offered/i)).not.toBeInTheDocument();
  });

  it("toggles an answer when its question is clicked", () => {
    render(<FAQ />);
    const q = screen.getByRole("button", { name: /When and where is it taking place/i });
    fireEvent.click(q);
    expect(q).toHaveAttribute("aria-expanded", "true");
  });
});

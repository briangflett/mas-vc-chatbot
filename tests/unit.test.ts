import { describe, it, expect } from "vitest";
import { splitSuggestions } from "../lib/suggestions";
import { identitySuffix } from "../lib/prompt";
import { isAuthorized, emailConsentGiven, type AuthContext } from "../lib/civicrm";

describe("splitSuggestions", () => {
  it("splits a trailing suggestion block", () => {
    const { body, suggestions } = splitSuggestions("Here is the answer.\n<<one|two|three>>");
    expect(body).toBe("Here is the answer.");
    expect(suggestions).toEqual(["one", "two", "three"]);
  });

  it("returns no suggestions when the block is absent", () => {
    const { body, suggestions } = splitSuggestions("Just an answer.");
    expect(body).toBe("Just an answer.");
    expect(suggestions).toEqual([]);
  });

  it("ignores empty pipe segments", () => {
    expect(splitSuggestions("x <<a||b| >>").suggestions).toEqual(["a", "b"]);
  });
});

describe("identitySuffix", () => {
  it("uses the contact ID and name when resolved", () => {
    expect(
      identitySuffix({ civicrmContactId: 42, civicrmDisplayName: "Jane VC" }),
    ).toBe("\n\n[Logged-in VC: Contact ID 42 (Jane VC)]");
  });

  it("falls back to email when unresolved", () => {
    expect(identitySuffix({ civicrmContactId: null, wpUserEmail: "j@x.org" })).toBe(
      "\n\n[Logged-in VC: contact ID unresolved, email: j@x.org]",
    );
  });
});

describe("access control", () => {
  const auth: AuthContext = {
    contactIds: new Set(["100", "200"]),
    orgIds: new Set(["900"]),
  };

  it("authorizes a contact in scope", () => {
    expect(isAuthorized(auth, 100)).toBe(true);
  });

  it("authorizes via employer org", () => {
    expect(isAuthorized(auth, 555, 900)).toBe(true);
  });

  it("denies a contact outside scope", () => {
    expect(isAuthorized(auth, 555, 111)).toBe(false);
  });

  it("recognizes email consent in its several truthy shapes", () => {
    expect(emailConsentGiven("1")).toBe(true);
    expect(emailConsentGiven(1)).toBe(true);
    expect(emailConsentGiven(true)).toBe(true);
    expect(emailConsentGiven("0")).toBe(false);
    expect(emailConsentGiven(null)).toBe(false);
  });
});

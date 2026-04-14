import Principal "mo:core/Principal";
import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Types "../types/reports";
import UserTypes "../types/users";

module {
  public func reportContent(
    reports : Map.Map<Text, Types.ReportInternal>,
    counter : { var value : Nat },
    caller : Principal,
    users : Map.Map<Principal, UserTypes.UserInternal>,
    contentType : Text,
    contentId : Text,
    reason : Text,
    details : ?Text,
  ) : { #ok : Types.Report; #err : Text } {
    if (contentType.size() == 0) return #err("Content type required");
    if (contentId.size() == 0) return #err("Content ID required");
    if (reason.size() == 0) return #err("Reason required");
    if (not users.containsKey(caller)) return #err("User not registered");
    counter.value += 1;
    let now = Time.now();
    let id = now.toText() # "-r-" # caller.toText() # "-" # counter.value.toText();
    let report : Types.ReportInternal = {
      id;
      reporterId = caller;
      contentType;
      contentId;
      reason;
      details;
      createdAt = now;
      var isReviewed = false;
    };
    reports.add(id, report);
    #ok(toPublic(report));
  };

  public func getReports(
    reports : Map.Map<Text, Types.ReportInternal>,
  ) : [Types.Report] {
    let all = List.empty<Types.ReportInternal>();
    reports.forEach(func(_, r) { all.add(r) });
    all.sortInPlace(func(a, b) { Int.compare(b.createdAt, a.createdAt) });
    all.toArray().map<Types.ReportInternal, Types.Report>(func r = toPublic(r));
  };

  public func dismissReport(
    reports : Map.Map<Text, Types.ReportInternal>,
    reportId : Text,
  ) : { #ok : (); #err : Text } {
    switch (reports.get(reportId)) {
      case null #err("Report not found");
      case (?r) {
        r.isReviewed := true;
        #ok(());
      };
    };
  };

  public func toPublic(report : Types.ReportInternal) : Types.Report {
    {
      id = report.id;
      reporterId = report.reporterId;
      contentType = report.contentType;
      contentId = report.contentId;
      reason = report.reason;
      details = report.details;
      createdAt = report.createdAt;
      isReviewed = report.isReviewed;
    };
  };
};

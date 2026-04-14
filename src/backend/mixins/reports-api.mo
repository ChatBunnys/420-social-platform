import Principal "mo:core/Principal";
import Map "mo:core/Map";
import ReportTypes "../types/reports";
import UserTypes "../types/users";
import ReportsLib "../lib/reports";

mixin (
  reports : Map.Map<Text, ReportTypes.ReportInternal>,
  users : Map.Map<Principal, UserTypes.UserInternal>,
  reportCounter : { var value : Nat },
) {
  public shared ({ caller }) func reportContent(
    contentType : Text,
    contentId : Text,
    reason : Text,
    details : ?Text,
  ) : async { #ok : ReportTypes.Report; #err : Text } {
    ReportsLib.reportContent(reports, reportCounter, caller, users, contentType, contentId, reason, details);
  };

  public query ({ caller }) func getReports() : async [ReportTypes.Report] {
    ReportsLib.getReports(reports);
  };

  public shared ({ caller }) func dismissReport(reportId : Text) : async { #ok : (); #err : Text } {
    ReportsLib.dismissReport(reports, reportId);
  };
};

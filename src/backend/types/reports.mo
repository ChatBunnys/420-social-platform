import Common "common";
import Principal "mo:core/Principal";

module {
  public type Timestamp = Common.Timestamp;
  public type ReportId = Common.ReportId;

  public type ReportInternal = {
    id : ReportId;
    reporterId : Principal;
    contentType : Text;
    contentId : Text;
    reason : Text;
    details : ?Text;
    createdAt : Timestamp;
    var isReviewed : Bool;
  };

  public type Report = {
    id : ReportId;
    reporterId : Principal;
    contentType : Text;
    contentId : Text;
    reason : Text;
    details : ?Text;
    createdAt : Timestamp;
    isReviewed : Bool;
  };
};

import Common "common";
import Principal "mo:core/Principal";

module {
  public type Timestamp = Common.Timestamp;
  public type StoryId = Common.StoryId;

  public type Story = {
    id : StoryId;
    authorId : Principal;
    content : ?Text;
    imageUrl : ?Text;
    createdAt : Timestamp;
    expiresAt : Timestamp;
  };
};

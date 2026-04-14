import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Time "mo:core/Time";
import StoryTypes "../types/stories";
import UserTypes "../types/users";
import StoriesLib "../lib/stories";

mixin (
  stories : Map.Map<Text, StoryTypes.Story>,
  users : Map.Map<Principal, UserTypes.UserInternal>,
  following : Map.Map<Principal, Set.Set<Principal>>,
  storyCounter : { var value : Nat },
) {
  public shared ({ caller }) func createStory(
    content : ?Text,
    imageUrl : ?Text,
  ) : async { #ok : StoryTypes.Story; #err : Text } {
    StoriesLib.createStory(stories, storyCounter, caller, users, content, imageUrl);
  };

  public query ({ caller }) func getActiveStories() : async [StoryTypes.Story] {
    StoriesLib.getActiveStories(stories, following, caller, Time.now());
  };

  public query ({ caller }) func getMyStories() : async [StoryTypes.Story] {
    StoriesLib.getMyStories(stories, caller, Time.now());
  };

  public query ({ caller }) func getAllActiveStories() : async [StoryTypes.Story] {
    StoriesLib.getAllActiveStories(stories, Time.now());
  };
};

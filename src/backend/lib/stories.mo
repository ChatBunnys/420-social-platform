import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Types "../types/stories";
import UserTypes "../types/users";

module {
  // 24 hours in nanoseconds
  let DAY_NS : Int = 86_400_000_000_000;

  public func createStory(
    stories : Map.Map<Text, Types.Story>,
    counter : { var value : Nat },
    caller : Principal,
    users : Map.Map<Principal, UserTypes.UserInternal>,
    content : ?Text,
    imageUrl : ?Text,
  ) : { #ok : Types.Story; #err : Text } {
    if (not users.containsKey(caller)) return #err("User not registered");
    let hasContent = switch (content) { case (?t) t.size() > 0; case null false };
    let hasImage = switch (imageUrl) { case (?u) u.size() > 0; case null false };
    if (not hasContent and not hasImage) return #err("Story must have content or image");
    counter.value += 1;
    let now = Time.now();
    let id = now.toText() # "-s-" # caller.toText() # "-" # counter.value.toText();
    let story : Types.Story = {
      id;
      authorId = caller;
      content;
      imageUrl;
      createdAt = now;
      expiresAt = now + DAY_NS;
    };
    stories.add(id, story);
    #ok(story);
  };

  public func getActiveStories(
    stories : Map.Map<Text, Types.Story>,
    following : Map.Map<Principal, Set.Set<Principal>>,
    caller : Principal,
    now : Int,
  ) : [Types.Story] {
    let followingSet = switch (following.get(caller)) {
      case (?s) s;
      case null Set.empty<Principal>();
    };
    let active = List.empty<Types.Story>();
    stories.forEach(func(_, s) {
      if (s.expiresAt > now and followingSet.contains(s.authorId)) {
        active.add(s);
      };
    });
    active.sortInPlace(func(a, b) { Int.compare(b.createdAt, a.createdAt) });
    active.toArray();
  };

  public func getMyStories(
    stories : Map.Map<Text, Types.Story>,
    caller : Principal,
    now : Int,
  ) : [Types.Story] {
    let mine = List.empty<Types.Story>();
    stories.forEach(func(_, s) {
      if (s.expiresAt > now and Principal.equal(s.authorId, caller)) {
        mine.add(s);
      };
    });
    mine.sortInPlace(func(a, b) { Int.compare(b.createdAt, a.createdAt) });
    mine.toArray();
  };

  public func getAllActiveStories(
    stories : Map.Map<Text, Types.Story>,
    now : Int,
  ) : [Types.Story] {
    let active = List.empty<Types.Story>();
    stories.forEach(func(_, s) {
      if (s.expiresAt > now) active.add(s);
    });
    active.sortInPlace(func(a, b) { Int.compare(b.createdAt, a.createdAt) });
    active.toArray();
  };
};

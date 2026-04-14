import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Types "../types/groups";
import UserTypes "../types/users";

module {
  public func createGroup(
    groups : Map.Map<Text, Types.GroupInternal>,
    counter : { var value : Nat },
    caller : Principal,
    users : Map.Map<Principal, UserTypes.UserInternal>,
    name : Text,
    description : Text,
    category : Text,
  ) : { #ok : Types.Group; #err : Text } {
    if (name.size() == 0) return #err("Group name cannot be empty");
    if (description.size() == 0) return #err("Group description cannot be empty");
    if (not users.containsKey(caller)) return #err("User not registered");
    counter.value += 1;
    let now = Time.now();
    let id = now.toText() # "-g-" # caller.toText() # "-" # counter.value.toText();
    let group : Types.GroupInternal = {
      id;
      var name = name;
      var description = description;
      var category = category;
      creatorId = caller;
      var memberCount = 1;
      createdAt = now;
    };
    groups.add(id, group);
    #ok(toPublic(group));
  };

  public func getGroup(
    groups : Map.Map<Text, Types.GroupInternal>,
    groupId : Text,
  ) : ?Types.Group {
    switch (groups.get(groupId)) {
      case (?g) ?toPublic(g);
      case null null;
    };
  };

  public func getAllGroups(
    groups : Map.Map<Text, Types.GroupInternal>,
  ) : [Types.Group] {
    groups.values().map<Types.GroupInternal, Types.Group>(func g = toPublic(g)).toArray();
  };

  public func joinGroup(
    groups : Map.Map<Text, Types.GroupInternal>,
    groupMembers : Map.Map<Text, Set.Set<Principal>>,
    caller : Principal,
    groupId : Text,
  ) : { #ok : (); #err : Text } {
    switch (groups.get(groupId)) {
      case null #err("Group not found");
      case (?g) {
        let members = switch (groupMembers.get(groupId)) {
          case (?s) s;
          case null {
            let s = Set.empty<Principal>();
            groupMembers.add(groupId, s);
            s;
          };
        };
        let wasAlreadyMember = members.contains(caller);
        members.add(caller);
        if (not wasAlreadyMember) g.memberCount += 1;
        #ok(());
      };
    };
  };

  public func leaveGroup(
    groups : Map.Map<Text, Types.GroupInternal>,
    groupMembers : Map.Map<Text, Set.Set<Principal>>,
    caller : Principal,
    groupId : Text,
  ) : { #ok : (); #err : Text } {
    switch (groups.get(groupId)) {
      case null #err("Group not found");
      case (?g) {
        if (Principal.equal(g.creatorId, caller)) {
          return #err("Creator cannot leave group. Delete the group instead.");
        };
        switch (groupMembers.get(groupId)) {
          case (?members) {
            let wasMember = members.contains(caller);
            members.remove(caller);
            if (wasMember and g.memberCount > 0) g.memberCount -= 1;
          };
          case null {};
        };
        #ok(());
      };
    };
  };

  public func getGroupMembers(
    groupMembers : Map.Map<Text, Set.Set<Principal>>,
    groupId : Text,
  ) : [Principal] {
    switch (groupMembers.get(groupId)) {
      case (?s) s.toArray();
      case null [];
    };
  };

  public func isGroupMember(
    groupMembers : Map.Map<Text, Set.Set<Principal>>,
    caller : Principal,
    groupId : Text,
  ) : Bool {
    switch (groupMembers.get(groupId)) {
      case (?s) s.contains(caller);
      case null false;
    };
  };

  public func createGroupPost(
    groupPosts : Map.Map<Text, Types.GroupPost>,
    groupMembers : Map.Map<Text, Set.Set<Principal>>,
    counter : { var value : Nat },
    caller : Principal,
    users : Map.Map<Principal, UserTypes.UserInternal>,
    groupId : Text,
    content : Text,
    imageUrl : ?Text,
  ) : { #ok : Types.GroupPost; #err : Text } {
    if (content.size() == 0) return #err("Content cannot be empty");
    if (not users.containsKey(caller)) return #err("User not registered");
    if (not isGroupMember(groupMembers, caller, groupId)) {
      return #err("Must be a group member to post");
    };
    counter.value += 1;
    let now = Time.now();
    let id = now.toText() # "-gp-" # caller.toText() # "-" # counter.value.toText();
    let post : Types.GroupPost = {
      id;
      groupId;
      authorId = caller;
      content;
      imageUrl;
      createdAt = now;
    };
    groupPosts.add(id, post);
    #ok(post);
  };

  public func getGroupPosts(
    groupPosts : Map.Map<Text, Types.GroupPost>,
    groupId : Text,
    limit : Nat,
    offset : Nat,
  ) : [Types.GroupPost] {
    let filtered = List.empty<Types.GroupPost>();
    groupPosts.forEach(func(_, p) {
      if (p.groupId == groupId) filtered.add(p);
    });
    filtered.sortInPlace(func(a, b) { Int.compare(b.createdAt, a.createdAt) });
    let arr = filtered.toArray();
    let start = if (offset >= arr.size()) arr.size() else offset;
    let end_ = if (start + limit > arr.size()) arr.size() else start + limit;
    arr.sliceToArray(start.toInt(), end_.toInt());
  };

  public func getUserGroups(
    groupMembers : Map.Map<Text, Set.Set<Principal>>,
    groups : Map.Map<Text, Types.GroupInternal>,
    caller : Principal,
  ) : [Types.Group] {
    let result = List.empty<Types.Group>();
    groupMembers.forEach(func(groupId, members) {
      if (members.contains(caller)) {
        switch (groups.get(groupId)) {
          case (?g) result.add(toPublic(g));
          case null {};
        };
      };
    });
    result.toArray();
  };

  public func deleteGroup(
    groups : Map.Map<Text, Types.GroupInternal>,
    groupMembers : Map.Map<Text, Set.Set<Principal>>,
    groupPosts : Map.Map<Text, Types.GroupPost>,
    caller : Principal,
    groupId : Text,
    isAdmin : Bool,
  ) : { #ok : (); #err : Text } {
    switch (groups.get(groupId)) {
      case null #err("Group not found");
      case (?g) {
        if (not Principal.equal(g.creatorId, caller) and not isAdmin) {
          return #err("Not authorized");
        };
        groups.remove(groupId);
        groupMembers.remove(groupId);
        // Remove all group posts
        let toRemove = List.empty<Text>();
        groupPosts.forEach(func(id, p) {
          if (p.groupId == groupId) toRemove.add(id);
        });
        toRemove.forEach(func(id) { groupPosts.remove(id) });
        #ok(());
      };
    };
  };

  public func toPublic(group : Types.GroupInternal) : Types.Group {
    {
      id = group.id;
      name = group.name;
      description = group.description;
      category = group.category;
      creatorId = group.creatorId;
      memberCount = group.memberCount;
      createdAt = group.createdAt;
    };
  };
};

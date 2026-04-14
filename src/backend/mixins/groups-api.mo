import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Set "mo:core/Set";
import GroupTypes "../types/groups";
import UserTypes "../types/users";
import GroupsLib "../lib/groups";

mixin (
  groups : Map.Map<Text, GroupTypes.GroupInternal>,
  groupMembers : Map.Map<Text, Set.Set<Principal>>,
  groupPosts : Map.Map<Text, GroupTypes.GroupPost>,
  users : Map.Map<Principal, UserTypes.UserInternal>,
  groupCounter : { var value : Nat },
  groupPostCounter : { var value : Nat },
) {
  public shared ({ caller }) func createGroup(
    name : Text,
    description : Text,
    category : Text,
  ) : async { #ok : GroupTypes.Group; #err : Text } {
    let result = GroupsLib.createGroup(groups, groupCounter, caller, users, name, description, category);
    switch (result) {
      case (#err(e)) #err(e);
      case (#ok(g)) {
        // Auto-join creator into groupMembers
        let members = Set.empty<Principal>();
        members.add(caller);
        groupMembers.add(g.id, members);
        #ok(g);
      };
    };
  };

  public query ({ caller }) func getGroup(groupId : Text) : async ?GroupTypes.Group {
    GroupsLib.getGroup(groups, groupId);
  };

  public query ({ caller }) func getAllGroups() : async [GroupTypes.Group] {
    GroupsLib.getAllGroups(groups);
  };

  public shared ({ caller }) func joinGroup(groupId : Text) : async { #ok : (); #err : Text } {
    GroupsLib.joinGroup(groups, groupMembers, caller, groupId);
  };

  public shared ({ caller }) func leaveGroup(groupId : Text) : async { #ok : (); #err : Text } {
    GroupsLib.leaveGroup(groups, groupMembers, caller, groupId);
  };

  public query ({ caller }) func getGroupMembers(groupId : Text) : async [Principal] {
    GroupsLib.getGroupMembers(groupMembers, groupId);
  };

  public query ({ caller }) func isGroupMember(groupId : Text) : async Bool {
    GroupsLib.isGroupMember(groupMembers, caller, groupId);
  };

  public shared ({ caller }) func createGroupPost(
    groupId : Text,
    content : Text,
    imageUrl : ?Text,
  ) : async { #ok : GroupTypes.GroupPost; #err : Text } {
    GroupsLib.createGroupPost(groupPosts, groupMembers, groupPostCounter, caller, users, groupId, content, imageUrl);
  };

  public query ({ caller }) func getGroupPosts(groupId : Text, limit : Nat, offset : Nat) : async [GroupTypes.GroupPost] {
    GroupsLib.getGroupPosts(groupPosts, groupId, limit, offset);
  };

  public query ({ caller }) func getUserGroups() : async [GroupTypes.Group] {
    GroupsLib.getUserGroups(groupMembers, groups, caller);
  };

  public shared ({ caller }) func deleteGroup(groupId : Text) : async { #ok : (); #err : Text } {
    GroupsLib.deleteGroup(groups, groupMembers, groupPosts, caller, groupId, false);
  };
};

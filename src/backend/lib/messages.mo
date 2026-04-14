import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Types "../types/messages";
import UserTypes "../types/users";

module {
  public func sendMessage(
    messages : Map.Map<Text, Types.MessageInternal>,
    counter : { var value : Nat },
    caller : Principal,
    users : Map.Map<Principal, UserTypes.UserInternal>,
    receiverId : Principal,
    content : Text,
  ) : { #ok : Types.Message; #err : Text } {
    if (content.size() == 0) return #err("Message cannot be empty");
    if (not users.containsKey(caller)) return #err("Sender not registered");
    if (not users.containsKey(receiverId)) return #err("Recipient not found");
    counter.value += 1;
    let now = Time.now();
    let id = now.toText() # "-m-" # caller.toText() # "-" # counter.value.toText();
    let msg : Types.MessageInternal = {
      id;
      senderId = caller;
      receiverId;
      var content = content;
      createdAt = now;
      var isRead = false;
    };
    messages.add(id, msg);
    #ok(toPublic(msg));
  };

  public func getConversations(
    messages : Map.Map<Text, Types.MessageInternal>,
    caller : Principal,
  ) : [Types.Conversation] {
    // Collect all unique conversation partners
    let partners = Set.empty<Principal>();
    messages.forEach(func(_, m) {
      if (Principal.equal(m.senderId, caller)) {
        partners.add(m.receiverId);
      } else if (Principal.equal(m.receiverId, caller)) {
        partners.add(m.senderId);
      };
    });

    let result = List.empty<Types.Conversation>();
    partners.forEach(func(otherId) {
      // Find latest message in this conversation
      var lastMsg : ?Types.MessageInternal = null;
      var unread : Nat = 0;
      messages.forEach(func(_, m) {
        let isConvo = (Principal.equal(m.senderId, caller) and Principal.equal(m.receiverId, otherId))
          or (Principal.equal(m.senderId, otherId) and Principal.equal(m.receiverId, caller));
        if (isConvo) {
          switch (lastMsg) {
            case null lastMsg := ?m;
            case (?prev) {
              if (m.createdAt > prev.createdAt) lastMsg := ?m;
            };
          };
          if (Principal.equal(m.senderId, otherId) and not m.isRead) {
            unread += 1;
          };
        };
      });
      result.add({
        otherUserId = otherId;
        lastMessage = switch (lastMsg) { case (?m) ?toPublic(m); case null null };
        unreadCount = unread;
      });
    });
    result.toArray();
  };

  public func getMessages(
    messages : Map.Map<Text, Types.MessageInternal>,
    caller : Principal,
    otherUserId : Principal,
  ) : [Types.Message] {
    let convo = List.empty<Types.MessageInternal>();
    messages.forEach(func(_, m) {
      let isConvo = (Principal.equal(m.senderId, caller) and Principal.equal(m.receiverId, otherUserId))
        or (Principal.equal(m.senderId, otherUserId) and Principal.equal(m.receiverId, caller));
      if (isConvo) convo.add(m);
    });
    convo.sortInPlace(func(a, b) { Int.compare(a.createdAt, b.createdAt) });
    convo.toArray().map<Types.MessageInternal, Types.Message>(func m = toPublic(m));
  };

  public func markMessagesRead(
    messages : Map.Map<Text, Types.MessageInternal>,
    caller : Principal,
    otherUserId : Principal,
  ) : () {
    messages.forEach(func(_, m) {
      if (Principal.equal(m.senderId, otherUserId) and Principal.equal(m.receiverId, caller)) {
        m.isRead := true;
      };
    });
  };

  public func getUnreadCount(
    messages : Map.Map<Text, Types.MessageInternal>,
    caller : Principal,
  ) : Nat {
    var count : Nat = 0;
    messages.forEach(func(_, m) {
      if (Principal.equal(m.receiverId, caller) and not m.isRead) {
        count += 1;
      };
    });
    count;
  };

  public func toPublic(msg : Types.MessageInternal) : Types.Message {
    {
      id = msg.id;
      senderId = msg.senderId;
      receiverId = msg.receiverId;
      content = msg.content;
      createdAt = msg.createdAt;
      isRead = msg.isRead;
    };
  };
};

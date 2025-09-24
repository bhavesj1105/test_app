# Typing indicators and read receipts

This document shows the events and client helpers added for typing indicators and read receipts.

## Socket.IO events

- typing:start { chatId, userId }
- typing:stop { chatId, userId }
- message:read { chatId, messageId, userId, readAt }

Server broadcasts to the chat room (excluding sender for typing events).

## React Native client

### useTyping(chatId)

import { useTyping } from '../hooks/useTyping';
import { TextInput, View, Text } from 'react-native';

function ChatInput({ chatId, selfUserId }: { chatId: string; selfUserId: string }) {
  const { onInputChange, isSomeoneTyping, usersTyping } = useTyping(chatId, selfUserId);
  return (
    <View>
      <TextInput onChangeText={onInputChange} placeholder="Message" />
      {isSomeoneTyping && <Text>{usersTyping.length === 1 ? 'Typing…' : 'Several typing…'}</Text>}
    </View>
  );
}

### Read receipts on visibility

import { FlatList } from 'react-native';
import { useVisibilityReporter } from '../hooks/useVisibilityReporter';

function MessageList({ chatId, messages }: { chatId: string; messages: Array<{ id: string; text: string }> }) {
  const { onViewableItemsChanged, viewabilityConfig } = useVisibilityReporter({ chatId, minVisiblePercent: 0.5 });
  return (
    <FlatList
      data={messages}
      keyExtractor={(m) => m.id}
      renderItem={({ item }) => /* render item */ null}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
    />
  );
}

### Socket client helpers

- socketService.sendTyping(chatId)
- socketService.stopTyping(chatId)
- socketService.markMessageRead(messageId, chatId)
- socketService.onTyping(cb)
- socketService.onMessageRead(cb)

Refer to `src/services/socket.ts` for the implementations.

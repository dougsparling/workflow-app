import { useCallback, useImperativeHandle, useState } from "react";
import { Button, Text, View } from "react-native";
import { runAgent } from "./workflow"

export default function Index() {
  let [text, setText] = useState("nil")

  let runner = useCallback(async () => {
    let resp = await runAgent();
    setText(resp);
  }, [])


  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Response: {text}</Text>
      <Button title="Go!" onPress={runner} />
    </View>
  );
}

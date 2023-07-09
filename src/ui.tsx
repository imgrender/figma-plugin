import {
  Button,
  Columns,
  Container,
  Muted,
  render,
  Text,
  TextboxNumeric,
  VerticalSpace,
} from "@create-figma-plugin/ui";
import { emit, on } from "@create-figma-plugin/utilities";
import { h } from "preact";
import { useCallback, useState } from "preact/hooks";

import {
  CloseHandler,
  CreateRectanglesHandler,
  OutputHandler,
  SaveToClipboardHandler,
} from "./types";
import { copyToClipboard } from "./utils";

function Plugin() {
  const [count, setCount] = useState<number | null>(5);
  const [countString, setCountString] = useState("5");
  const handleCreateRectanglesButtonClick = useCallback(
    function () {
      if (count !== null) {
        emit<CreateRectanglesHandler>("CREATE_RECTANGLES", count);
      }
    },
    [count]
  );

  const handleOutputButtonClick = useCallback(function () {
    on<SaveToClipboardHandler>("SAVE_TO_CLIPBOARD", function (content: string) {
      copyToClipboard(content);
      alert("导出成功");
    });

    // delay to allow the loading state to be set
    setTimeout(() => emit<OutputHandler>("OUTPUT"), 100);
  }, []);

  return (
    <Container space="medium">
      <VerticalSpace space="large" />
      <Text>
        <Muted>Count</Muted>
      </Text>
      <VerticalSpace space="small" />
      <TextboxNumeric
        onNumericValueInput={setCount}
        onValueInput={setCountString}
        value={countString}
        variant="border"
      />
      <VerticalSpace space="extraLarge" />
      <Columns space="extraSmall">
        <Button fullWidth onClick={handleOutputButtonClick}>
          Output
        </Button>
      </Columns>
      <VerticalSpace space="small" />
    </Container>
  );
}

export default render(Plugin);

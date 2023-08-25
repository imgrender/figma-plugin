import {
  Button,
  Columns,
  Container,
  render,
  VerticalSpace,
} from "@create-figma-plugin/ui";
import { emit, on } from "@create-figma-plugin/utilities";
import { h } from "preact";
import { useCallback, useState } from "preact/hooks";

import { OutputHandler, SaveToClipboardHandler } from "./types";
import { copyToClipboard } from "./utils";

function Plugin() {
  const handleOutputButtonClick = useCallback(function () {
    on<SaveToClipboardHandler>("SAVE_TO_CLIPBOARD", function (content: string) {
      copyToClipboard(content);
    });

    // delay to allow the loading state to be set
    setTimeout(() => emit<OutputHandler>("OUTPUT"), 100);
  }, []);

  return (
    <Container space="medium">
      <VerticalSpace space="extraLarge" />
      <Columns space="extraSmall">
        <Button fullWidth onClick={handleOutputButtonClick}>
          Output
        </Button>
      </Columns>
    </Container>
  );
}

export default render(Plugin);

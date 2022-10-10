import { MessageKeys, MessageTypes } from "./Game/CommunicationConsts";
import { getDefaultSvgLoadConfig } from "./Game/GameRunner";
import { EventQueue } from "./Game/Input/EventQueue";
import { GameInteractionController } from "./Game/Input/UserInteraction";
import { setCanvasSizeToMatchLayout } from "./Game/Renderer/Renderer";
import { setupGameWithDefaults } from "./GameInitializerHelper";

export {
	setupGameWithDefaults,
	getDefaultSvgLoadConfig,
	setCanvasSizeToMatchLayout,
	EventQueue,
	GameInteractionController,
	MessageTypes,
	MessageKeys,
}


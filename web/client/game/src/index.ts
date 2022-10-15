import { MessageKeys, MessageTypes } from "./Game/CommunicationConsts";
import { getDefaultSvgLoadConfig } from "./Game/GameRunner";
import { EventQueue } from "./Game/Input/EventQueue";
import { CommunicationEvent, CommunicationEventTypes, CommunicationStack } from "./Game/Input/UserInputEvents";
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
	CommunicationStack,
	CommunicationEventTypes,
	CommunicationEvent,
}


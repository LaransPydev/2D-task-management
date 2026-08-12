"use client";

import { useApp } from "../app-context";
import NewProjectModal from "./NewProjectModal";
import MoveModal from "./MoveModal";
import BlockModal from "./BlockModal";
import EditModal from "./EditModal";
import WhoModal from "./WhoModal";
import DeleteModal from "./DeleteModal";
import WipeModal from "./WipeModal";
import ManageDesignersModal from "./ManageDesignersModal";
import ManageDtypesModal from "./ManageDtypesModal";
import ManageMarketsModal from "./ManageMarketsModal";
import ManageRosterModal from "./ManageRosterModal";

export default function ModalRoot() {
  const { modal } = useApp();
  if (!modal) return null;
  switch (modal.kind) {
    case "new":
      return <NewProjectModal />;
    case "move":
      return <MoveModal projectId={modal.projectId} to={modal.to} />;
    case "block":
      return <BlockModal projectId={modal.projectId} />;
    case "edit":
      return <EditModal projectId={modal.projectId} />;
    case "who":
      return <WhoModal />;
    case "del":
      return <DeleteModal projectId={modal.projectId} />;
    case "wipe":
      return <WipeModal />;
    case "designers":
      return <ManageDesignersModal />;
    case "dtypes":
      return <ManageDtypesModal />;
    case "mktypes":
      return <ManageMarketsModal />;
    case "roster":
      return <ManageRosterModal />;
    default:
      return null;
  }
}

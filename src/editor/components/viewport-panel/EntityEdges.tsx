import { Edges } from '@react-three/drei';
import React from 'react';

interface IEntityEdgesProps {
  selected: boolean;
}

const EntityEdges: React.FC<IEntityEdgesProps> = ({ selected }) => {
  if (!selected) return null;
  return <Edges scale={1.05} color="orange" threshold={15} />;
};

export default EntityEdges;

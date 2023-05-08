export abstract class IMapper<Entity, Model> {
  abstract toPersistence(model: Model): Entity;
  abstract toPersistence(model: Model[]): Entity[];
  abstract toModel(entity: Entity): Model;
  abstract toModel(entity: Entity[]): Model[];
}

export abstract class IDTOMapper<Model, DTO> {
  abstract toModel(dto: DTO): Model;
  abstract toModel(dto: DTO[]): Model[];
  abstract toDTO(model: Model): DTO;
  abstract toDTO(model: Model[]): DTO[];
}

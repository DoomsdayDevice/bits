export abstract class IMapper<Entity, Model> {
  abstract toPersistence(model: Model): Entity;
  abstract toPersistence(model: Model[]): Entity[];
  abstract toDomain(entity: Entity): Model;
  abstract toDomain(entity: Entity[]): Model[];
}

export abstract class IDTOMapper<Model, DTO> {
  abstract toDomain(dto: DTO): Model;
  abstract toDomain(dto: DTO[]): Model[];
  abstract toDTO(model: Model): DTO;
  abstract toDTO(model: Model[]): DTO[];
}

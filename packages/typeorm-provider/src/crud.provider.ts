export class TypeormProvider {
  buildTypeormService(): Type<ICrudService<T>> {
    this.imports.push(TypeOrmModule.forFeature([this.Model]));

    return getGenericCrudService(this.Model);
  }
}

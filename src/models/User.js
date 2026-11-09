const { DataTypes, Model } = require("sequelize");

class User extends Model {
  /** Nunca devolve o hash da senha nas respostas. */
  toJSON() {
    const { id, firstname, surname, email } = this.get();
    return { id, firstname, surname, email };
  }
}

module.exports = (sequelize) =>
  User.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      firstname: { type: DataTypes.STRING, allowNull: false },
      surname: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      // Guarda o hash gerado pelo bcrypt, nunca a senha em texto puro
      password: { type: DataTypes.STRING, allowNull: false },
    },
    { sequelize, modelName: "User", tableName: "users" },
  );

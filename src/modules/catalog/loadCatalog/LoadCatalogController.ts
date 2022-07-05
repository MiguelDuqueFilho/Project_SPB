import { Request, Response } from 'express';
import { LoadCatalogUseCase } from './LoadCatalogUseCase';

export class LoadCatalogController {
  async handle(request: Request, response: Response) {
    const loadCatalogUseCase = new LoadCatalogUseCase();
    const result = await loadCatalogUseCase.execute({
      filename:
        './catalogSFN/Catalogo_de_Servicos_do_SFN_Volume_III_Versao_503.pdf',
    });

    return response.json(result);
  }
}

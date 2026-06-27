using API.Authorization;
using API.Dtos;
using API.Entities;
using API.Services;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.AdminAndStudent)]
[Route("api/questions/past-exams")]
public class PastExamQuestionsController(
    IPastExamService pastExamService,
    IValidator<PastExamQuestionQueryDto> queryValidator) : ControllerBase
{
    [Authorize(Policy = AuthorizationPolicies.StudentOnly)]
    [HttpGet]
    public async Task<ActionResult<PastExamQuestionListResponseDto>> GetPastExamQuestions(
        [FromQuery] PastExamQuestionQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var validation = await queryValidator.ValidateAsync(query, cancellationToken);
        if (!validation.IsValid)
        {
            return BadRequest(string.Join(" ", validation.Errors.Select(x => x.ErrorMessage)));
        }

        ExamSession? session = null;
        if (!string.IsNullOrWhiteSpace(query.Session))
        {
            session = Enum.Parse<ExamSession>(query.Session, ignoreCase: true);
        }

        IReadOnlyList<ExamType>? examTypes = null;
        if (!string.IsNullOrWhiteSpace(query.ExamTypes))
        {
            examTypes = query.ExamTypes
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(x => Enum.Parse<ExamType>(x, ignoreCase: true))
                .Distinct()
                .ToList();
        }

        IReadOnlyList<int>? years = null;
        if (!string.IsNullOrWhiteSpace(query.Years))
        {
            years = query.Years
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(x => int.Parse(x))
                .Distinct()
                .ToList();
        }

        IReadOnlyList<Guid>? topicIds = null;
        if (!string.IsNullOrWhiteSpace(query.TopicIds))
        {
            topicIds = query.TopicIds
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(Guid.Parse)
                .Distinct()
                .ToList();
        }

        var filter = new PastExamQuestionFilterDto(
            examTypes,
            years,
            session,
            topicIds,
            query.Difficulty,
            query.Search);

        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var response = await pastExamService.GetPastExamQuestionsAsync(filter, page, pageSize, cancellationToken);
        return Ok(response);
    }
}

